"""Test tầng LLM (parse offline) + định tuyến handle_message (mock LLM, không gọi mạng)."""

from datetime import date

from fastapi.testclient import TestClient

from app.services import llm
from app.services.llm import parse_llm_json

TODAY = date(2026, 6, 9)


def test_parse_transaction_valid() -> None:
    raw = (
        '{"kind":"transaction","draft":{"amount":50000,"type":"expense",'
        '"category_name":"","note":"ăn trưa cùng team","date":"2026-06-08"}}'
    )
    r = parse_llm_json(raw, TODAY)
    assert r["kind"] == "transaction"
    assert r["draft"]["amount"] == 50000
    assert r["draft"]["type"] == "expense"
    assert r["draft"]["date"] == date(2026, 6, 8)
    assert r["draft"]["category_name"] == "Ăn uống"  # gợi ý từ note


def test_parse_transaction_missing_amount() -> None:
    assert parse_llm_json('{"kind":"transaction","draft":{"type":"expense"}}', TODAY) is None


def test_parse_transaction_bad_type() -> None:
    raw = '{"kind":"transaction","draft":{"amount":1000,"type":"xyz"}}'
    assert parse_llm_json(raw, TODAY) is None


def test_parse_question_valid() -> None:
    assert parse_llm_json('{"kind":"question","question":"wallet_balance"}', TODAY) == {
        "kind": "question",
        "question": "wallet_balance",
    }


def test_parse_question_unknown_intent() -> None:
    assert parse_llm_json('{"kind":"question","question":"weather"}', TODAY) is None


def test_parse_faq_valid() -> None:
    assert parse_llm_json('{"kind":"faq","faq":"emergency_fund"}', TODAY) == {
        "kind": "faq",
        "faq": "emergency_fund",
    }


def test_parse_faq_unknown_id() -> None:
    assert parse_llm_json('{"kind":"faq","faq":"weather"}', TODAY) is None


def test_parse_other() -> None:
    r = parse_llm_json('{"kind":"other","reply":"Chào bạn"}', TODAY)
    assert r["kind"] == "other"
    assert r["reply"] == "Chào bạn"


def test_parse_bad_json() -> None:
    assert parse_llm_json("không phải json", TODAY) is None


def test_no_key_uses_rule(client: TestClient, owner: dict, monkeypatch) -> None:
    """Không có key → không gọi classify_message, đi đường rule."""
    called = {"v": False}

    def _fake(*_a, **_k):
        called["v"] = True
        return None

    monkeypatch.setattr(llm, "llm_enabled", lambda: False)
    monkeypatch.setattr(llm, "classify_message", _fake)
    r = client.post(
        "/assistant/message", json={"text": "ăn trưa 50k hôm qua"}, headers=owner["headers"]
    )
    assert r.json()["kind"] == "transaction"
    assert called["v"] is False


def test_llm_transaction_route(client: TestClient, owner: dict, monkeypatch) -> None:
    monkeypatch.setattr(llm, "llm_enabled", lambda: True)
    monkeypatch.setattr(
        llm,
        "classify_message",
        lambda text, today: {
            "kind": "transaction",
            "draft": {
                "amount": 99000,
                "type": "expense",
                "note": "x",
                "category_name": "Ăn uống",
                "date": today,
            },
        },
    )
    r = client.post("/assistant/message", json={"text": "bất kỳ"}, headers=owner["headers"])
    b = r.json()
    assert b["kind"] == "transaction"
    assert b["draft"]["amount"] == 99000


def test_llm_question_uses_db(client: TestClient, owner: dict, monkeypatch) -> None:
    h = owner["headers"]
    today = date.today()
    for amt in (100000, 50000):
        client.post(
            "/transactions",
            json={"amount": amt, "type": "expense", "note": "x", "date": today.isoformat()},
            headers=h,
        )
    monkeypatch.setattr(llm, "llm_enabled", lambda: True)
    monkeypatch.setattr(
        llm,
        "classify_message",
        lambda text, today2: {"kind": "question", "question": "expense_month"},
    )
    r = client.post("/assistant/message", json={"text": "hỏi gì đó"}, headers=h)
    assert r.json()["kind"] == "answer"
    assert "150" in r.json()["reply"]  # số liệu tính từ DB


def test_llm_faq_route(client: TestClient, owner: dict, monkeypatch) -> None:
    """LLM khớp id FAQ → backend trả nội dung KB chuẩn (không lấy chữ từ LLM)."""
    monkeypatch.setattr(llm, "llm_enabled", lambda: True)
    monkeypatch.setattr(
        llm, "classify_message", lambda text, today: {"kind": "faq", "faq": "emergency_fund"}
    )
    r = client.post("/assistant/message", json={"text": "hỏi gì đó"}, headers=owner["headers"])
    b = r.json()
    assert b["kind"] == "faq"
    assert "3–6 tháng" in b["reply"]


def test_llm_other_route(client: TestClient, owner: dict, monkeypatch) -> None:
    monkeypatch.setattr(llm, "llm_enabled", lambda: True)
    monkeypatch.setattr(
        llm, "classify_message", lambda text, today: {"kind": "other", "reply": "Xin chào!"}
    )
    r = client.post("/assistant/message", json={"text": "hi"}, headers=owner["headers"])
    assert r.json()["kind"] == "answer"
    assert r.json()["reply"] == "Xin chào!"


def test_llm_failure_falls_back(client: TestClient, owner: dict, monkeypatch) -> None:
    """LLM trả None (lỗi) → fallback rule vẫn parse được giao dịch."""
    monkeypatch.setattr(llm, "llm_enabled", lambda: True)
    monkeypatch.setattr(llm, "classify_message", lambda text, today: None)
    r = client.post(
        "/assistant/message", json={"text": "ăn trưa 50k hôm qua"}, headers=owner["headers"]
    )
    assert r.json()["kind"] == "transaction"
    assert r.json()["draft"]["amount"] == 50000


def test_parse_goal_valid() -> None:
    assert parse_llm_json('{"kind":"goal","target_amount":100000000,"months":24}', TODAY) == {
        "kind": "goal",
        "target_amount": 100000000.0,
        "months": 24,
    }


def test_parse_goal_no_months() -> None:
    r = parse_llm_json('{"kind":"goal","target_amount":50000000,"months":null}', TODAY)
    assert r == {"kind": "goal", "target_amount": 50000000.0, "months": None}


def test_parse_goal_bad_amount() -> None:
    assert parse_llm_json('{"kind":"goal","target_amount":0}', TODAY) is None


def test_llm_goal_route(client: TestClient, owner: dict, monkeypatch) -> None:
    """LLM trích mục tiêu → backend đánh giá khả thi từ net tháng."""
    h = owner["headers"]
    today = date.today().isoformat()
    client.post(
        "/transactions",
        json={"amount": 10_000_000, "type": "income", "note": "l", "date": today},
        headers=h,
    )
    monkeypatch.setattr(llm, "llm_enabled", lambda: True)
    monkeypatch.setattr(
        llm,
        "classify_message",
        lambda text, today2: {"kind": "goal", "target_amount": 60_000_000, "months": 12},
    )
    r = client.post("/assistant/message", json={"text": "xyz"}, headers=h)
    b = r.json()
    assert b["kind"] == "answer"
    assert "Mục tiêu" in b["reply"]


def test_parse_question_allocation() -> None:
    assert parse_llm_json('{"kind":"question","question":"allocation_review"}', TODAY) == {
        "kind": "question",
        "question": "allocation_review",
    }


def test_llm_allocation_route(client: TestClient, owner: dict, monkeypatch) -> None:
    """LLM chọn intent allocation_review → backend tính đánh giá từ DB."""
    h = owner["headers"]
    today = date.today()
    client.post(
        "/categories",
        json={"name": "Tiền nhà", "type": "expense", "need_level": "mandatory"},
        headers=h,
    )
    client.post(
        "/transactions",
        json={"amount": 20_000_000, "type": "income", "note": "l", "date": today.isoformat()},
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
    monkeypatch.setattr(llm, "llm_enabled", lambda: True)
    monkeypatch.setattr(
        llm,
        "classify_message",
        lambda text, today2: {"kind": "question", "question": "allocation_review"},
    )
    r = client.post("/assistant/message", json={"text": "abc"}, headers=h)
    b = r.json()
    assert b["kind"] == "answer"
    assert "Phân bổ" in b["reply"] and "50/30/20" in b["reply"]
