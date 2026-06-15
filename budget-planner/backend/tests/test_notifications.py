"""Test Notifications (3 nguồn + unread/mark/read-all + cô lập)."""

from datetime import date

from fastapi.testclient import TestClient


def _make_recurring_noti(client: TestClient, headers: dict) -> None:
    today = date.today().isoformat()
    client.post(
        "/recurring",
        json={
            "name": "Tiền nhà",
            "amount": 1000,
            "type": "expense",
            "frequency": "daily",
            "start_date": today,
            "category_name": "X",
        },
        headers=headers,
    )
    client.post("/recurring/run", headers=headers)


def test_budget_exceeded_creates_notification(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    cid = client.post("/categories", json={"name": "Ăn uống", "type": "expense"}, headers=h).json()[
        "id"
    ]
    month = date.today().strftime("%Y-%m")
    client.post(
        "/budgets", json={"category_id": cid, "period": month, "limit_amount": 100000}, headers=h
    )
    client.post(
        "/transactions",
        json={
            "amount": 150000,
            "type": "expense",
            "category_name": "Ăn uống",
            "date": date.today().isoformat(),
        },
        headers=h,
    )
    notis = client.get("/notifications", headers=h).json()
    assert any(n["type"] == "budget.exceeded" for n in notis)


def test_member_invite_creates_notification(client: TestClient, owner: dict, make_member) -> None:
    make_member(owner, role="member", email="m@x.com")
    notis = client.get("/notifications", headers=owner["headers"]).json()
    assert any(n["type"] == "member.invited" for n in notis)


def test_recurring_run_creates_notification(client: TestClient, owner: dict) -> None:
    _make_recurring_noti(client, owner["headers"])
    notis = client.get("/notifications", headers=owner["headers"]).json()
    assert any(n["type"] == "recurring.ran" for n in notis)


def test_unread_and_mark_read(client: TestClient, owner: dict, make_member) -> None:
    make_member(owner, role="member", email="m@x.com")
    h = owner["headers"]
    c0 = client.get("/notifications/unread-count", headers=h).json()["count"]
    assert c0 >= 1
    nid = client.get("/notifications", headers=h).json()[0]["id"]
    assert client.patch(f"/notifications/{nid}/read", headers=h).status_code == 200
    assert client.get("/notifications/unread-count", headers=h).json()["count"] == c0 - 1


def test_read_all(client: TestClient, owner: dict, make_member) -> None:
    make_member(owner, role="member", email="m1@x.com")
    make_member(owner, role="member", email="m2@x.com")
    h = owner["headers"]
    assert client.get("/notifications/unread-count", headers=h).json()["count"] >= 2
    client.post("/notifications/read-all", headers=h)
    assert client.get("/notifications/unread-count", headers=h).json()["count"] == 0


def test_isolation(client: TestClient, register) -> None:
    u1 = register(email="u1@x.com")
    u2 = register(email="u2@x.com")
    _make_recurring_noti(client, u1["headers"])
    assert len(client.get("/notifications", headers=u2["headers"]).json()) == 0


def test_viewer_can_read(client: TestClient, owner: dict, make_member) -> None:
    make_member(owner, role="member", email="m@x.com")
    v = make_member(owner, role="viewer", email="v@x.com")
    r = client.get("/notifications", headers=v["headers"])
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_notify_budget_flag_gates_notification(client: TestClient, owner: dict) -> None:
    """Tắt cờ notify_budget → không tạo thông báo budget.exceeded; bật lại → có."""
    h = owner["headers"]
    sid = owner["space_id"]
    cid = client.post("/categories", json={"name": "Ăn uống", "type": "expense"}, headers=h).json()[
        "id"
    ]
    month = date.today().strftime("%Y-%m")
    client.post(
        "/budgets", json={"category_id": cid, "period": month, "limit_amount": 100000}, headers=h
    )

    def _overflow(amount: int) -> None:
        client.post(
            "/transactions",
            json={
                "amount": amount,
                "type": "expense",
                "category_name": "Ăn uống",
                "date": date.today().isoformat(),
            },
            headers=h,
        )

    # Tắt → không có thông báo vượt ngân sách
    client.patch(f"/spaces/{sid}", json={"notify_budget": False}, headers=h)
    _overflow(150000)
    notis = client.get("/notifications", headers=h).json()
    assert not any(n["type"] == "budget.exceeded" for n in notis)

    # Bật lại → có
    client.patch(f"/spaces/{sid}", json={"notify_budget": True}, headers=h)
    _overflow(200000)
    notis = client.get("/notifications", headers=h).json()
    assert any(n["type"] == "budget.exceeded" for n in notis)
