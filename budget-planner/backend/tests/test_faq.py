"""Test KB hỏi-đáp kiến thức tài chính (hàm thuần, không DB)."""

from app.services.faq import FAQ_INTENTS, answer_faq, match_faq


def test_match_faq_hits() -> None:
    assert match_faq("tôi nên tiết kiệm bao nhiêu % thu nhập mỗi tháng") == "saving_rate"
    assert match_faq("Quỹ khẩn cấp nên có bao nhiêu tiền?") == "emergency_fund"
    assert match_faq("cần bao nhiêu để đạt tự do tài chính") == "financial_freedom"
    assert match_faq("quy tắc 50/30/20 là gì") == "rule_50_30_20"
    assert match_faq("trả cho mình trước nghĩa là gì") == "pay_yourself_first"


def test_match_faq_miss() -> None:
    assert match_faq("ăn trưa 50k hôm qua") is None
    assert match_faq("xin chào bạn") is None
    assert match_faq("") is None
    # Câu hỏi số liệu thuần KHÔNG được khớp FAQ (để assistant trả số từ DB).
    assert match_faq("tháng này chi bao nhiêu?") is None
    assert match_faq("số dư ví?") is None


def test_answer_faq_static_all_intents() -> None:
    # Mọi entry không cần ctx vẫn trả kiến thức chung (chuỗi không rỗng).
    for fid in FAQ_INTENTS:
        ans = answer_faq(fid, {})
        assert isinstance(ans, str) and ans.strip()


def test_answer_faq_unknown_id() -> None:
    assert answer_faq("khong_ton_tai", {}) is None


def test_answer_faq_personalized_emergency() -> None:
    ans = answer_faq("emergency_fund", {"monthly_expense": 10_000_000})
    assert "30.000.000" in ans  # 3× chi tiêu tháng
    assert "60.000.000" in ans  # 6× chi tiêu tháng


def test_answer_faq_emergency_dependents() -> None:
    # Có người phụ thuộc → quỹ 6–12× (thay vì 3–6×).
    ans = answer_faq("emergency_fund", {"monthly_expense": 10_000_000, "dependents": 2})
    assert "6–12 tháng" in ans
    assert "60.000.000" in ans and "120.000.000" in ans


def test_answer_faq_personalized_saving() -> None:
    ans = answer_faq("saving_rate", {"monthly_income": 20_000_000})
    assert "4.000.000" in ans  # 20% × 20tr


def test_answer_faq_personalized_freedom() -> None:
    ans = answer_faq("financial_freedom", {"monthly_expense": 10_000_000})
    assert "3.000.000.000" in ans  # 25 × 12 × 10tr


def test_answer_faq_zero_context_no_crash() -> None:
    # Số liệu 0/thiếu → chỉ kiến thức chung, không lỗi.
    assert isinstance(answer_faq("emergency_fund", {"monthly_expense": 0}), str)
    assert isinstance(answer_faq("saving_rate", {}), str)
