"""Test API Wallets (CRUD + transfer, RBAC, cô lập space)."""

from fastapi.testclient import TestClient


def _wallet(
    client: TestClient,
    headers: dict,
    name: str = "Tiền mặt",
    wtype: str = "cash",
    balance: float = 0,
):
    return client.post(
        "/wallets", json={"name": name, "type": wtype, "balance": balance}, headers=headers
    )


def test_create_wallet(client: TestClient, owner: dict) -> None:
    r = _wallet(client, owner["headers"], name="Tiền mặt", balance=100000)
    assert r.status_code == 201
    b = r.json()
    assert b["name"] == "Tiền mặt"
    assert b["type"] == "cash"
    assert b["balance"] == 100000
    assert b["space_id"] == owner["space_id"]


def test_create_wallet_requires_admin(client: TestClient, owner: dict, make_member) -> None:
    m = make_member(owner, role="member", email="m@x.com")
    assert _wallet(client, m["headers"]).status_code == 403


def test_list_wallets_viewer_ok(client: TestClient, owner: dict, make_member) -> None:
    _wallet(client, owner["headers"])
    v = make_member(owner, role="viewer", email="v@x.com")
    r = client.get("/wallets", headers=v["headers"])
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_get_cross_space_404(client: TestClient, register) -> None:
    u1 = register(email="u1@x.com")
    u2 = register(email="u2@x.com")
    wid = _wallet(client, u1["headers"]).json()["id"]
    assert client.get(f"/wallets/{wid}", headers=u2["headers"]).status_code == 404


def test_update_wallet(client: TestClient, owner: dict) -> None:
    wid = _wallet(client, owner["headers"]).json()["id"]
    r = client.patch(
        f"/wallets/{wid}", json={"name": "Ngân hàng", "type": "bank"}, headers=owner["headers"]
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Ngân hàng"
    assert r.json()["type"] == "bank"


def test_delete_wallet(client: TestClient, owner: dict) -> None:
    wid = _wallet(client, owner["headers"]).json()["id"]
    assert client.delete(f"/wallets/{wid}", headers=owner["headers"]).status_code == 204
    assert client.get(f"/wallets/{wid}", headers=owner["headers"]).status_code == 404
    logs = client.get("/audit-logs", headers=owner["headers"]).json()
    assert any(log["action"] == "wallet.deleted" for log in logs)


def test_transfer(client: TestClient, owner: dict) -> None:
    a = _wallet(client, owner["headers"], name="A", balance=100000).json()["id"]
    b = _wallet(client, owner["headers"], name="B", balance=0).json()["id"]
    r = client.post(
        "/wallets/transfer",
        json={"from_wallet_id": a, "to_wallet_id": b, "amount": 30000},
        headers=owner["headers"],
    )
    assert r.status_code == 200
    balances = {
        w["id"]: w["balance"] for w in client.get("/wallets", headers=owner["headers"]).json()
    }
    assert balances[a] == 70000
    assert balances[b] == 30000
    logs = client.get("/audit-logs", headers=owner["headers"]).json()
    assert any(log["action"] == "wallet.transfer" for log in logs)


def test_transfer_same_wallet_400(client: TestClient, owner: dict) -> None:
    a = _wallet(client, owner["headers"]).json()["id"]
    r = client.post(
        "/wallets/transfer",
        json={"from_wallet_id": a, "to_wallet_id": a, "amount": 1000},
        headers=owner["headers"],
    )
    assert r.status_code == 400


def test_transfer_member_ok(client: TestClient, owner: dict, make_member) -> None:
    a = _wallet(client, owner["headers"], name="A", balance=50000).json()["id"]
    b = _wallet(client, owner["headers"], name="B").json()["id"]
    m = make_member(owner, role="member", email="m@x.com")
    r = client.post(
        "/wallets/transfer",
        json={"from_wallet_id": a, "to_wallet_id": b, "amount": 1000},
        headers=m["headers"],
    )
    assert r.status_code == 200


def test_transfer_unknown_wallet_404(client: TestClient, owner: dict) -> None:
    a = _wallet(client, owner["headers"]).json()["id"]
    r = client.post(
        "/wallets/transfer",
        json={"from_wallet_id": a, "to_wallet_id": "khong-co", "amount": 1000},
        headers=owner["headers"],
    )
    assert r.status_code == 404
