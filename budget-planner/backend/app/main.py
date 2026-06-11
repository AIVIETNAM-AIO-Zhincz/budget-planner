"""Khởi tạo FastAPI app: routers, health, đăng ký event handlers."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    assistant,
    audit,
    auth,
    budgets,
    categories,
    goals,
    members,
    notifications,
    plans,
    recurring,
    reports,
    spaces,
    transactions,
    wallets,
)
from app.core.config import settings
from app.events.handlers import register_handlers

app = FastAPI(title=settings.app_name, version="0.1.0")

# Cho phép frontend (Vite dev / domain cấu hình) gọi API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký handler cho event bus (Event-Driven Architecture).
register_handlers()

app.include_router(auth.router)
app.include_router(spaces.router)
app.include_router(members.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(budgets.router)
app.include_router(wallets.router)
app.include_router(goals.router)
app.include_router(reports.router)
app.include_router(plans.router)
app.include_router(recurring.router)
app.include_router(notifications.router)
app.include_router(assistant.router)
app.include_router(audit.router)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    """Kiểm tra sống (smoke)."""
    return {"status": "ok"}
