"""Test nhập CSV giao dịch (preview dry-run + commit, bỏ qua dòng lỗi)."""

from fastapi.testclient import TestClient

HEADER = "date,type,category_name,note,amount"


def _csv(rows: list[str]) -> bytes:
    return ("\n".join(rows)).encode("utf-8")


def _upload(client: TestClient, headers: dict, content: bytes, dry_run: bool):
    flag = "true" if dry_run else "false"
    return client.post(
        f"/transactions/import?dry_run={flag}",
        files={"file": ("tx.csv", content, "text/csv")},
        headers=headers,
    )


def test_import_dry_run(client: TestClient, owner: dict) -> None:
    content = _csv(
        [
            HEADER,
            "2026-06-01,expense,Ăn uống,Ăn trưa,50000",
            "bad,expense,X,lỗi ngày,1000",
            "2026-06-02,wrong,X,lỗi loại,1000",
            "2026-06-03,expense,X,lỗi tiền,abc",
        ]
    )
    r = _upload(client, owner["headers"], content, True)
    assert r.status_code == 200
    b = r.json()
    assert b["dry_run"] is True
    assert b["valid_count"] == 1
    assert b["error_count"] == 3
    assert b["created"] == 0
    assert len(client.get("/transactions", headers=owner["headers"]).json()) == 0
    assert {e["line"] for e in b["errors"]} == {3, 4, 5}


def test_import_commit_skips_errors(client: TestClient, owner: dict) -> None:
    content = _csv(
        [
            HEADER,
            "2026-06-01,expense,Ăn uống,Ăn trưa,50000",
            "2026-06-02,income,Lương,Lương,15000000",
            "bad,expense,X,lỗi,1000",
        ]
    )
    r = _upload(client, owner["headers"], content, False)
    b = r.json()
    assert b["created"] == 2
    assert b["error_count"] == 1
    assert len(client.get("/transactions", headers=owner["headers"]).json()) == 2


def test_import_suggests_category(client: TestClient, owner: dict) -> None:
    content = _csv([HEADER, "2026-06-01,expense,,ăn trưa cùng team,50000"])
    r = _upload(client, owner["headers"], content, False)
    assert r.json()["created"] == 1
    tx = client.get("/transactions", headers=owner["headers"]).json()[0]
    assert tx["category_name"] == "Ăn uống"


def test_import_handles_bom(client: TestClient, owner: dict) -> None:
    content = ("﻿" + HEADER + "\n2026-06-01,expense,X,note,1000").encode("utf-8")
    r = _upload(client, owner["headers"], content, True)
    assert r.json()["valid_count"] == 1


def test_import_requires_member(client: TestClient, owner: dict, make_member) -> None:
    v = make_member(owner, role="viewer", email="v@x.com")
    content = _csv([HEADER, "2026-06-01,expense,X,n,1000"])
    assert _upload(client, v["headers"], content, False).status_code == 403
