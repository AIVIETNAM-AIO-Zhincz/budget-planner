"""Test Saving Goals (CRUD + contribute = transfer, RBAC, cô lập)."""

from fastapi.testclient import TestClient


def _wallet(client: TestClient, headers: dict, name: str, balance: float = 0) -> str:
    return client.post(
        "/wallets", json={"name": name, "type": "cash", "balance": balance}, headers=headers
    ).json()["id"]


def _goal(client: TestClient, headers: dict, wallet_id: str, **kw):
    payload = {"name": "Du lịch", "target_amount": 1000000, "wallet_id": wallet_id, **kw}
    return client.post("/goals", json=payload, headers=headers)


def test_create_goal(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    wid = _wallet(client, h, "Quỹ du lịch", 200000)
    r = _goal(client, h, wid)
    assert r.status_code == 201
    b = r.json()
    assert b["name"] == "Du lịch"
    assert b["target_amount"] == 1000000
    assert b["wallet_id"] == wid
    assert b["saved_amount"] == 200000
    assert b["percent"] == 20.0
    assert b["wallet_name"] == "Quỹ du lịch"


def test_create_requires_member(client: TestClient, owner: dict, make_member) -> None:
    wid = _wallet(client, owner["headers"], "Q")
    v = make_member(owner, role="viewer", email="v@x.com")
    assert _goal(client, v["headers"], wid).status_code == 403


def test_list_goals_viewer(client: TestClient, owner: dict, make_member) -> None:
    wid = _wallet(client, owner["headers"], "Q")
    _goal(client, owner["headers"], wid)
    v = make_member(owner, role="viewer", email="v@x.com")
    r = client.get("/goals", headers=v["headers"])
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_contribute(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    src = _wallet(client, h, "Tiền mặt", 500000)
    sav = _wallet(client, h, "Quỹ", 0)
    gid = _goal(client, h, sav, target_amount=1000000).json()["id"]
    r = client.post(
        f"/goals/{gid}/contribute", json={"from_wallet_id": src, "amount": 300000}, headers=h
    )
    assert r.status_code == 200
    b = r.json()
    assert b["saved_amount"] == 300000
    assert b["percent"] == 30.0
    bals = {w["id"]: w["balance"] for w in client.get("/wallets", headers=h).json()}
    assert bals[src] == 200000
    assert bals[sav] == 300000


def test_contribute_same_wallet_400(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    sav = _wallet(client, h, "Quỹ", 0)
    gid = _goal(client, h, sav).json()["id"]
    r = client.post(
        f"/goals/{gid}/contribute", json={"from_wallet_id": sav, "amount": 1000}, headers=h
    )
    assert r.status_code == 400


def test_contribute_unknown_wallet_404(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    sav = _wallet(client, h, "Quỹ")
    gid = _goal(client, h, sav).json()["id"]
    r = client.post(
        f"/goals/{gid}/contribute", json={"from_wallet_id": "khong-co", "amount": 1000}, headers=h
    )
    assert r.status_code == 404


def test_delete_goal(client: TestClient, owner: dict) -> None:
    h = owner["headers"]
    wid = _wallet(client, h, "Q")
    gid = _goal(client, h, wid).json()["id"]
    assert client.delete(f"/goals/{gid}", headers=h).status_code == 204
    assert client.get(f"/goals/{gid}", headers=h).status_code == 404


def test_cross_space_404(client: TestClient, register) -> None:
    u1 = register(email="u1@x.com")
    u2 = register(email="u2@x.com")
    wid = _wallet(client, u1["headers"], "Q")
    gid = _goal(client, u1["headers"], wid).json()["id"]
    assert client.get(f"/goals/{gid}", headers=u2["headers"]).status_code == 404
