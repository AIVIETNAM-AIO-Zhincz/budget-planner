"""Cấu hình ứng dụng (đọc từ biến môi trường)."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Thiết lập runtime của backend.

    Đọc từ env hoặc file .env; mặc định dùng SQLite cho dev.
    """

    app_name: str = "Budget Planner API"
    database_url: str = "sqlite:///./budget_planner.db"
    # Không gian mặc định khi chưa có auth/RBAC (slice Transactions đầu tiên).
    default_space_id: str = "default-space"
    # Origin frontend được phép gọi API (CORS).
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(env_file=".env", env_prefix="BP_", extra="ignore")


settings = Settings()
