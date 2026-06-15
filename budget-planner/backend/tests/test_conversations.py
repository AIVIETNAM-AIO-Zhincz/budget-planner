"""Test thread chat của Trợ lý: tạo / liệt kê / nhắn / đổi tên / xoá + cô lập theo user."""

from __future__ import annotations

from fastapi.testclient import TestClient


def _create(client: TestClient, headers: dict, title: str | None = None) -> dict:
    body = {} if title is None else {"title": title}
    res = client.post("/assistant/conversations", json=body, headers=headers)
    assert res.status_code == 201, res.text
    return res.json()


def test_create_and_list_conversation(owner: dict, client: TestClient) -> None:
    """Tạo thread mới → xuất hiện trong danh sách của user."""
    conv = _create(client, owner["headers"])
    assert conv["id"]
    assert conv["title"] == ""

    res = client.get("/assistant/conversations", headers=owner["headers"])
    assert res.status_code == 200
    ids = [c["id"] for c in res.json()]
    assert conv["id"] in ids


def test_post_message_persists_and_auto_titles(owner: dict, client: TestClient) -> None:
    """Nhắn trong thread → lưu cả tin user + bot; tiêu đề tự đặt từ tin đầu."""
    conv = _create(client, owner["headers"])
    res = client.post(
        f"/assistant/conversations/{conv['id']}/message",
        json={"text": "Cà phê 30k"},
        headers=owner["headers"],
    )
    assert res.status_code == 200, res.text
    assert res.json()["reply"]

    detail = client.get(f"/assistant/conversations/{conv['id']}", headers=owner["headers"]).json()
    roles = [m["role"] for m in detail["messages"]]
    assert roles[0] == "user"
    assert "bot" in roles
    assert detail["messages"][0]["text"] == "Cà phê 30k"
    # Tiêu đề tự sinh từ tin nhắn đầu tiên.
    assert detail["title"].startswith("Cà phê")


def test_rename_and_delete(owner: dict, client: TestClient) -> None:
    """Đổi tên rồi xoá thread."""
    conv = _create(client, owner["headers"])
    r = client.patch(
        f"/assistant/conversations/{conv['id']}",
        json={"title": "Tư vấn tiết kiệm"},
        headers=owner["headers"],
    )
    assert r.status_code == 200
    assert r.json()["title"] == "Tư vấn tiết kiệm"

    d = client.delete(f"/assistant/conversations/{conv['id']}", headers=owner["headers"])
    assert d.status_code == 204
    assert (
        client.get(f"/assistant/conversations/{conv['id']}", headers=owner["headers"]).status_code
        == 404
    )


def test_conversations_isolated_per_user(owner: dict, make_member, client: TestClient) -> None:
    """Thread là riêng tư: thành viên khác cùng không gian không thấy / không truy cập được."""
    conv = _create(client, owner["headers"])
    member = make_member(owner, "admin", "mate@x.com")

    listed = client.get("/assistant/conversations", headers=member["headers"]).json()
    assert all(c["id"] != conv["id"] for c in listed)

    assert (
        client.get(f"/assistant/conversations/{conv['id']}", headers=member["headers"]).status_code
        == 404
    )
    assert (
        client.post(
            f"/assistant/conversations/{conv['id']}/message",
            json={"text": "hi"},
            headers=member["headers"],
        ).status_code
        == 404
    )


def test_message_to_missing_conversation_404(owner: dict, client: TestClient) -> None:
    """Nhắn vào thread không tồn tại → 404."""
    res = client.post(
        "/assistant/conversations/does-not-exist/message",
        json={"text": "hi"},
        headers=owner["headers"],
    )
    assert res.status_code == 404
