import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  apiFetch,
  setTokens,
  setSpace,
  setUnauthorizedHandler,
} from "./client.js";

function mockResponse({ status = 200, body = {} } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

beforeEach(() => {
  localStorage.clear();
  global.fetch = vi.fn();
  setUnauthorizedHandler(null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("apiFetch", () => {
  it("gắn Authorization + X-Space-Id từ localStorage", async () => {
    setTokens("acc", "ref");
    setSpace("space-1");
    global.fetch.mockResolvedValueOnce(mockResponse({ body: { ok: true } }));

    const data = await apiFetch("/transactions");

    expect(data).toEqual({ ok: true });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain("/transactions");
    expect(opts.headers.Authorization).toBe("Bearer acc");
    expect(opts.headers["X-Space-Id"]).toBe("space-1");
  });

  it("204 → null", async () => {
    global.fetch.mockResolvedValueOnce(mockResponse({ status: 204 }));
    expect(await apiFetch("/x", { method: "DELETE" })).toBeNull();
  });

  it("non-ok → ApiError kèm status + message", async () => {
    global.fetch.mockResolvedValueOnce(mockResponse({ status: 400, body: { detail: "sai dữ liệu" } }));
    await expect(apiFetch("/x")).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "sai dữ liệu",
    });
  });

  it("lỗi mạng → ApiError status 0", async () => {
    global.fetch.mockRejectedValueOnce(new Error("network down"));
    await expect(apiFetch("/x")).rejects.toMatchObject({ name: "ApiError", status: 0 });
  });

  it("401 → refresh thành công → retry trả body", async () => {
    setTokens("old", "ref");
    global.fetch
      .mockResolvedValueOnce(mockResponse({ status: 401 })) // gọi gốc
      .mockResolvedValueOnce(mockResponse({ body: { access_token: "new", refresh_token: "ref2" } })) // /auth/refresh
      .mockResolvedValueOnce(mockResponse({ body: { done: true } })); // retry

    const data = await apiFetch("/transactions");

    expect(data).toEqual({ done: true });
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(localStorage.getItem("bp-access")).toBe("new");
  });

  it("401 → refresh thất bại → clearAuth + handler + throw 401", async () => {
    setTokens("old", "ref");
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    global.fetch
      .mockResolvedValueOnce(mockResponse({ status: 401 })) // gọi gốc
      .mockResolvedValueOnce(mockResponse({ status: 401 })); // /auth/refresh fail

    await expect(apiFetch("/transactions")).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("bp-access")).toBeNull();
    expect(localStorage.getItem("bp-refresh")).toBeNull();
  });
});
