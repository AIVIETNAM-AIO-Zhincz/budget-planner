.PHONY: help backend-install migrate migration backend-dev test lint frontend-install frontend-dev up down

BE = backend
VENV = $(BE)/.venv/bin

help:
	@echo "Targets: backend-install migrate migration backend-dev test lint frontend-install frontend-dev up down"

backend-install:
	cd $(BE) && python3 -m venv .venv && .venv/bin/pip install -U pip && .venv/bin/pip install -r requirements.txt

migrate:
	cd $(BE) && .venv/bin/alembic upgrade head

# Tạo migration mới:  make migration m="add wallet balance"
migration:
	cd $(BE) && .venv/bin/alembic revision --autogenerate -m "$(m)"

backend-dev:
	cd $(BE) && .venv/bin/uvicorn app.main:app --reload --port 8000

test:
	cd $(BE) && .venv/bin/python -m pytest -q

lint:
	cd $(BE) && .venv/bin/ruff check app tests

frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

up:
	docker compose up --build

down:
	docker compose down
