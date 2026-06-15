"""Test Trợ lý: parser ngôn ngữ tự nhiên + hỏi-đáp số liệu."""

from datetime import date

from fastapi.testclient import TestClient

from app.services.assistant import parse_amount, parse_date, parse_transaction, parse_type

TODAY = date(2026, 6, 9)


def test_parse_amount() -> None:
    assert parse_amount("ăn trưa 50k") == 50000
    assert parse_amount("50 nghìn") == 50000
    assert parse_amount("lương 15tr") == 15000000
    assert parse_amount("1.5tr") == 1500000
    assert parse_amount("mua nhà 2 tỷ") == 2000000000
    assert parse_amount("1.5 tỷ") == 1500000000
    assert parse_amount("mua đồ 50.000") == 50000
    assert parse_amount("trả 1.000.000") == 1000000
    assert parse_amount("không có số") is None


def test_parse_date() -> None:
    assert parse_date("ăn trưa hôm qua", TODAY) == date(2026, 6, 8)
    assert parse_date("hôm kia", TODAY) == date(2026, 6, 7)
    assert parse_date("3 ngày trước", TODAY) == date(2026, 6, 6)
    assert parse_date("ngày 01/05", TODAY) == date(2026, 5, 1)
    assert parse_date("không có ngày", TODAY) == TODAY


def test_parse_type() -> None:
    assert parse_type("ăn trưa 50k") == "expense"
    assert parse_type("lương tháng 6 15tr") == "income"
    assert parse_type("nhận thưởng 2tr") == "income"


def test_parse_transaction() -> None:
    d = parse_transaction("ăn trưa 50k hôm qua", TODAY)
    assert d["amount"] == 50000
    assert d["type"] == "expense"
    assert d["date"] == date(2026, 6, 8)
    assert d["category_name"] == "Ăn uống"
    assert parse_transaction("xin chào", TODAY) is None


def test_assistant_transaction(client: TestClient, owner: dict) -> None:
    r = client.post(
        "/assistant/message", json={"text": "ăn trưa 50k hôm qua"}, headers=owner["headers"]
    )
    assert r.status_code == 200
    b = r.json()
    assert b["kind"] == "transaction"
    assert b["draft"]["amount"] == 50000
    assert b["draft"]["category_name"] == "Ăn uống"


def test_assistant_query_expense(client: TestClient, owner: dict) -> None:
    today = date.today()
    for amt in (100000, 50000):
        client.post(
            "/transactions",
            json={"amount": amt, "type": "expense", "note": "x", "date": today.isoformat()},
            headers=owner["headers"],
        )
    r = client.post(
        "/assistant/message", json={"text": "tháng này chi bao nhiêu?"}, headers=owner["headers"]
    )
    assert r.status_code == 200
    assert r.json()["kind"] == "answer"
    assert "150" in r.json()["reply"]  # 150.000 đ


def test_assistant_query_wallet(client: TestClient, owner: dict) -> None:
    client.post(
        "/wallets",
        json={"name": "Tiền mặt", "type": "cash", "balance": 200000},
        headers=owner["headers"],
    )
    r = client.post("/assistant/message", json={"text": "số dư ví?"}, headers=owner["headers"])
    assert r.json()["kind"] == "answer"
    assert "Tiền mặt" in r.json()["reply"]


def test_assistant_faq_knowledge(client: TestClient, owner: dict) -> None:
    r = client.post(
        "/assistant/message",
        json={"text": "Quỹ khẩn cấp nên có bao nhiêu?"},
        headers=owner["headers"],
    )
    assert r.status_code == 200
    b = r.json()
    assert b["kind"] == "faq"
    assert "3–6 tháng" in b["reply"]
    assert b["draft"] is None


def test_assistant_faq_personalized(client: TestClient, owner: dict) -> None:
    today = date.today()
    for amt in (6_000_000, 4_000_000):  # chi tháng = 10tr
        client.post(
            "/transactions",
            json={"amount": amt, "type": "expense", "note": "x", "date": today.isoformat()},
            headers=owner["headers"],
        )
    r = client.post(
        "/assistant/message",
        json={"text": "quỹ khẩn cấp nên có bao nhiêu tiền?"},
        headers=owner["headers"],
    )
    b = r.json()
    assert b["kind"] == "faq"
    assert "30.000.000" in b["reply"] and "60.000.000" in b["reply"]  # 3×–6× của 10tr


def test_assistant_faq_not_hijacked_by_data_query(client: TestClient, owner: dict) -> None:
    # Câu hỏi tiết kiệm chứa "thu"/"tháng" nhưng phải trả FAQ, không phải số liệu thu nhập.
    r = client.post(
        "/assistant/message",
        json={"text": "tôi nên tiết kiệm bao nhiêu % thu nhập mỗi tháng?"},
        headers=owner["headers"],
    )
    assert r.json()["kind"] == "faq"


def test_assistant_allocation_review(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    today = date.today()
    client.post(
        "/categories",
        json={"name": "Tiền nhà", "type": "expense", "need_level": "mandatory"},
        headers=h,
    )
    client.post(
        "/transactions",
        json={"amount": 20_000_000, "type": "income", "note": "luong", "date": today.isoformat()},
        headers=h,
    )
    client.post(
        "/transactions",
        json={
            "amount": 9_000_000,
            "type": "expense",
            "note": "x",
            "category_name": "Tiền nhà",
            "date": today.isoformat(),
        },
        headers=h,
    )
    r = client.post(
        "/assistant/message", json={"text": "phân bổ của tôi đã hợp lý chưa?"}, headers=h
    )
    b = r.json()
    assert b["kind"] == "answer"
    assert "Phân bổ" in b["reply"]
    assert "50/30/20" in b["reply"]  # có đề xuất


def test_assistant_goal_feasibility(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    today = date.today().isoformat()
    # Net tháng = 5tr (thu 10tr − chi 5tr).
    client.post(
        "/transactions",
        json={"amount": 10_000_000, "type": "income", "note": "l", "date": today},
        headers=h,
    )
    client.post(
        "/transactions",
        json={"amount": 5_000_000, "type": "expense", "note": "x", "date": today},
        headers=h,
    )
    r = client.post(
        "/assistant/message",
        json={"text": "tôi muốn để dành 100 triệu trong 2 năm"},
        headers=h,
    )
    b = r.json()
    assert b["kind"] == "answer"
    assert "Mục tiêu" in b["reply"]
    assert "tháng" in b["reply"]


def test_assistant_personalized_by_profile(client: TestClient, owner: dict) -> None:
    """Hồ sơ (thu nhập + người phụ thuộc) cá nhân hoá lời khuyên khi chưa ghi giao dịch thu."""
    h = owner["headers"]
    client.put("/profile", json={"monthly_income": 20_000_000, "dependents": 2}, headers=h)
    # Phân bổ: dùng thu nhập hồ sơ làm gốc (không rơi vào "chưa ghi thu nhập").
    r = client.post(
        "/assistant/message", json={"text": "phân bổ của tôi đã hợp lý chưa?"}, headers=h
    )
    assert r.json()["kind"] == "answer"
    assert "Phân bổ" in r.json()["reply"]
    # Quỹ khẩn cấp: bội số 6–12 do có người phụ thuộc.
    r2 = client.post(
        "/assistant/message", json={"text": "quỹ khẩn cấp nên có bao nhiêu?"}, headers=h
    )
    assert r2.json()["kind"] == "faq"
    assert "6–12 tháng" in r2.json()["reply"]


def test_assistant_forecast(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    today = date.today()

    def month_ago(n: int) -> str:
        m, y = today.month - n, today.year
        while m <= 0:
            m += 12
            y -= 1
        return date(y, m, 15).isoformat()

    for n, amt in ((3, 1_000_000), (2, 2_000_000), (1, 3_000_000)):
        client.post(
            "/transactions",
            json={"amount": amt, "type": "expense", "note": "x", "date": month_ago(n)},
            headers=h,
        )
    r = client.post("/assistant/message", json={"text": "dự báo chi tháng sau"}, headers=h)
    b = r.json()
    assert b["kind"] == "answer"
    assert "Dự báo chi tháng sau" in b["reply"]


def test_assistant_weekly_summary(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    client.post(
        "/transactions",
        json={
            "amount": 2_000_000,
            "type": "expense",
            "note": "x",
            "date": date.today().isoformat(),
        },
        headers=h,
    )
    r = client.post("/assistant/message", json={"text": "tóm tắt tuần này"}, headers=h)
    b = r.json()
    assert b["kind"] == "answer"
    assert "Tuần qua" in b["reply"]


def test_assistant_unknown(client: TestClient, owner: dict) -> None:
    r = client.post("/assistant/message", json={"text": "xin chào bạn"}, headers=owner["headers"])
    assert r.json()["kind"] == "unknown"


def test_assistant_requires_token(client: TestClient) -> None:
    assert client.post("/assistant/message", json={"text": "hi"}).status_code == 401
