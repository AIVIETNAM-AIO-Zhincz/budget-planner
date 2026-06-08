"""Test phát hiện vượt ngân sách: giao dịch vượt limit → phát BudgetExceeded."""

import logging

from fastapi.testclient import TestClient


def _setup_budget(client: TestClient, headers: dict, limit: float) -> None:
    """Tạo danh mục 'Ăn uống' + ngân sách period 2026-06 với limit cho trước."""
    cid = client.post(
        "/categories", json={"name": "Ăn uống", "type": "expense"}, headers=headers
    ).json()["id"]
    client.post(
        "/budgets",
        json={"period": "2026-06", "limit_amount": limit, "category_id": cid},
        headers=headers,
    )


def test_expense_over_limit_emits_warning(client: TestClient, owner: dict, caplog) -> None:
    """Chi vượt hạn mức → handler log cảnh báo 'Vượt ngân sách'."""
    _setup_budget(client, owner["headers"], limit=100000)

    with caplog.at_level(logging.WARNING):
        client.post(
            "/transactions",
            json={
                "amount": 150000,
                "note": "ăn trưa",
                "category_name": "Ăn uống",
                "date": "2026-06-10",
            },
            headers=owner["headers"],
        )
    assert "Vượt ngân sách" in caplog.text


def test_expense_equal_limit_no_warning(client: TestClient, owner: dict, caplog) -> None:
    """Chi đúng bằng hạn mức (không lớn hơn) → KHÔNG cảnh báo."""
    _setup_budget(client, owner["headers"], limit=100000)

    with caplog.at_level(logging.WARNING):
        client.post(
            "/transactions",
            json={
                "amount": 100000,
                "note": "ăn",
                "category_name": "Ăn uống",
                "date": "2026-06-10",
            },
            headers=owner["headers"],
        )
    assert "Vượt ngân sách" not in caplog.text


def test_income_does_not_trigger(client: TestClient, owner: dict, caplog) -> None:
    """Khoản thu không kích hoạt cảnh báo vượt ngân sách."""
    _setup_budget(client, owner["headers"], limit=100000)

    with caplog.at_level(logging.WARNING):
        client.post(
            "/transactions",
            json={
                "amount": 500000,
                "type": "income",
                "note": "lương",
                "category_name": "Ăn uống",
                "date": "2026-06-10",
            },
            headers=owner["headers"],
        )
    assert "Vượt ngân sách" not in caplog.text
