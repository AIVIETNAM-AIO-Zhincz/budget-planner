# Coding Style (Python)

- Tuân thủ **PEP 8**; thụt lề 4 dấu cách; dòng ≤ ~100 ký tự.
- Format bằng **`black`**, lint bằng **`ruff`** (chạy trước khi commit).
- **Type hint** cho tham số & giá trị trả về của hàm public.
- **Docstring tiếng Việt** ngắn gọn cho mỗi hàm/class (mục đích, input/output).
- Ưu tiên **hàm thuần (pure function)**, dễ test; tránh side-effect ẩn.
- Dùng `if __name__ == "__main__":` cho demo; không để code chạy ở cấp module.
- Không thêm dependency mới khi chưa cần (YAGNI).
