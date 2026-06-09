import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("../api/auth.js", () => ({
  login: vi.fn().mockResolvedValue({ access_token: "a", refresh_token: "r" }),
  getMe: vi.fn().mockResolvedValue({ id: "u1", email: "demo@x.com", name: "Demo" }),
  register: vi.fn(),
}));
vi.mock("../api/spaces.js", () => ({
  listSpaces: vi.fn().mockResolvedValue([{ id: "s1", name: "Cá nhân", role: "owner" }]),
}));

import AuthProvider, { useAuth } from "./AuthContext.jsx";

function Probe() {
  const { status, user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.email || "-"}</span>
      <button onClick={() => login("demo@x.com", "pw")}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("AuthContext", () => {
  it("không token → anon; login → authed + user; logout → anon", async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("anon"));

    await userEvent.click(screen.getByRole("button", { name: "login" }));
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authed"));
    expect(screen.getByTestId("user")).toHaveTextContent("demo@x.com");

    await userEvent.click(screen.getByRole("button", { name: "logout" }));
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("anon"));
    expect(screen.getByTestId("user")).toHaveTextContent("-");
  });
});
