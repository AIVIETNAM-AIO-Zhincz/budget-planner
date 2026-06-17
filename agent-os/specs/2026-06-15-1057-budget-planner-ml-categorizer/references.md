# References for ML phân loại giao dịch

## Similar Implementations

### Categorizer hiện tại (rule baseline)

- **Location:** `conquer/budget-planner/backend/app/services/categorizer.py`
- **Relevance:** `_KEYWORD_RULES` + `FALLBACK_CATEGORY="Khác"` + `suggest_category(note)`. Tách
  `_rule_match` từ logic keyword (làm lưới fallback), thêm tầng ML phía trước.
- **Key patterns:** lowercase + `any(kw in text ...)`; fallback "Khác".

### Nơi gọi suggest_category (giữ nguyên chữ ký)

- **Location:** `api/transactions.py` (create dòng ~79 + import CSV ~133), `services/llm.py` (~79),
  `services/assistant.py` (~105)
- **Relevance:** đều gọi `suggest_category(note) -> str` → **không đổi interface** thì 4 nơi này không
  cần sửa.

### Test categorizer (giữ xanh)

- **Location:** `conquer/budget-planner/backend/tests/test_categorizer.py`
- **Relevance:** 5 ghi chú → danh mục cụ thể + "Khác" cho lạ/rỗng. Seed phải phủ các ví dụ này để ML
  đoán đúng; rule vẫn là lưới an toàn.

### Ràng buộc dữ liệu

- **Location:** `.gitignore` (chặn `*.csv`, `*.parquet`, `data/`, `models/`)
- **Relevance:** dataset để **module Python** (`category_data.py`) — là code, không bị gitignore. Model
  không commit `.pkl` → train-on-load.

### Dependency + Makefile

- **Location:** `backend/requirements.txt` (`scikit-learn>=1.4`), `conquer/budget-planner/Makefile`
  (targets `test`/`lint`)
- **Relevance:** sklearn sẵn có; thêm target `eval-categorizer` cho eval/báo cáo.
