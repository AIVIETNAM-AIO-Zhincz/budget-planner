# Branching Strategy — GitFlow

Repo **Budget Planner** theo mô hình **GitFlow** (Vincent Driessen), bản gọn.

## Nhánh dài hạn (long-lived)

| Nhánh | Vai trò |
|---|---|
| `main` | Mã ổn định đã chạy/demo được. **Default branch.** Mỗi mốc release gắn `tag` (vd `v0.1.0`). |
| `develop` | Nhánh tích hợp — gom mọi thay đổi cho phiên bản kế tiếp. **Làm việc hằng ngày ở đây.** |

> Repo gốc `aio2026-practice` dùng `production`; ở đây dùng `main` (mặc định GitHub) cho cùng vai trò "nhánh ổn định".

## Nhánh hỗ trợ (tạm thời — tạo khi cần, xoá sau khi merge)

| Nhánh | Tạo từ | Gộp về | Mục đích |
|---|---|---|---|
| `feature/*` | `develop` | `develop` | Một tính năng (vd `feature/BP-wallets`) |
| `release/*` | `develop` | `main` + `develop` | Hoàn thiện trước phát hành (vd `release/0.1.0`) |
| `hotfix/*` | `main` | `main` + `develop` | Sửa lỗi khẩn cấp trên bản đã phát hành |

## Quy trình mẫu

```bash
# Tính năng mới
git switch develop
git switch -c feature/BP-wallets
# ... code, commit ...
# → mở Pull Request vào develop, CI xanh, review rồi merge
git switch develop && git pull
git branch -d feature/BP-wallets

# Phát hành
git switch -c release/0.1.0 develop
git switch main && git merge release/0.1.0
git tag -a v0.1.0 -m "Release 0.1.0"
git switch develop && git merge release/0.1.0
```

## Mã tính năng (BẮT BUỘC) & đặt tên nhánh

Mỗi `feature/*` bám một **ticket/khu vực chức năng** của Budget Planner; commit thể hiện được thuộc phần nào để truy vết.

| Khu vực | Định dạng mã | Ví dụ |
|---|---|---|
| Tính năng Budget Planner | `BP-{khu_vực}` | `BP-wallets`, `BP-auth`, `BP-reports`, `BP-llm` |
| Hạ tầng/CI/docs | `INFRA-{chủ_đề}` · `DOCS-{chủ_đề}` | `INFRA-ci`, `DOCS-readme` |

```
feature/{MÃ}-{slug-ngắn}      vd: feature/BP-wallets-transfer
```

- Một nhánh = một ticket. Không gộp nhiều mã khác nhau vào một `feature/*`.
- **KHÔNG commit thẳng vào `main`.** Mọi thay đổi qua `feature/*` → PR → merge `develop`.

## CI

`.github/workflows/ci.yml` chạy trên push/PR vào `main`/`develop` khi đụng `budget-planner/**`:
- **backend:** ruff lint · Alembic migration · pytest
- **frontend:** `npm ci` · vitest
- **docker:** build image backend

## Commit message

Tiếng Anh ngắn gọn theo Conventional Commits khi hợp lý (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
