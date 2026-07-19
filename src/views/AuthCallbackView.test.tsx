import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import AuthCallback from "./AuthCallbackView";
import { exchangeCodeForTokens, saveTokens } from "../services/auth";

// Hoisted so they are available inside vi.mock factory functions.
const mockNavigate = vi.hoisted(() => vi.fn());
const mockLogin = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../store/authStore", () => ({
  useAuthStore: () => ({ login: mockLogin }),
}));

vi.mock("../services/auth", () => ({
  exchangeCodeForTokens: vi.fn(),
  saveTokens: vi.fn(),
}));

const mockTokens = {
  access_token: "access-abc",
  refresh_token: "refresh-xyz",
  expires_in: 3600,
  membership_id: "mem-123",
  token_type: "Bearer",
  refresh_expires_in: 7776000,
};

describe("AuthCallbackView", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogin.mockClear();
    vi.mocked(exchangeCodeForTokens).mockReset();
    vi.mocked(saveTokens).mockReset();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // Immediate render
  // -------------------------------------------------------------------------
  it('renders the "Logging in..." message', () => {
    vi.stubGlobal("location", { search: "" });
    render(<AuthCallback />);
    expect(screen.getByText("Logging in...")).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // CSRF / state validation
  // -------------------------------------------------------------------------
  it('navigates to "/" without exchanging tokens when no code is present', async () => {
    vi.stubGlobal("location", { search: "" });
    sessionStorage.setItem("oauth_state", "teststate");
    render(<AuthCallback />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
    expect(exchangeCodeForTokens).not.toHaveBeenCalled();
  });

  it('navigates to "/" without exchanging tokens when the state does not match', async () => {
    vi.stubGlobal("location", { search: "?code=abc&state=wrong" });
    sessionStorage.setItem("oauth_state", "correct");
    render(<AuthCallback />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
    expect(exchangeCodeForTokens).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Success path
  // -------------------------------------------------------------------------
  it('exchanges the code, saves tokens, logs in, and navigates to "/" on success', async () => {
    vi.stubGlobal("location", { search: "?code=testcode&state=teststate" });
    sessionStorage.setItem("oauth_state", "teststate");
    vi.mocked(exchangeCodeForTokens).mockResolvedValueOnce(mockTokens);

    render(<AuthCallback />);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
    expect(exchangeCodeForTokens).toHaveBeenCalledWith("testcode");
    expect(saveTokens).toHaveBeenCalledWith(mockTokens);
    expect(mockLogin).toHaveBeenCalledWith(
      mockTokens.access_token,
      mockTokens.refresh_token,
      expect.any(Number), // expiresAt computed from Date.now()
      mockTokens.membership_id,
    );
  });

  // -------------------------------------------------------------------------
  // Failure path
  // -------------------------------------------------------------------------
  it('navigates to "/" when the token exchange throws', async () => {
    vi.stubGlobal("location", { search: "?code=testcode&state=teststate" });
    sessionStorage.setItem("oauth_state", "teststate");
    vi.mocked(exchangeCodeForTokens).mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<AuthCallback />);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
    expect(mockLogin).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // StrictMode double-invocation guard (the hasFetched ref)
  // React StrictMode mounts → unmounts → remounts in development to surface
  // side-effect bugs. The hasFetched ref persists across this cycle, so the
  // token exchange should only be called once even though the effect runs twice.
  // -------------------------------------------------------------------------
  it("only calls exchangeCodeForTokens once under React StrictMode", async () => {
    vi.stubGlobal("location", { search: "?code=testcode&state=teststate" });
    sessionStorage.setItem("oauth_state", "teststate");
    vi.mocked(exchangeCodeForTokens).mockResolvedValue(mockTokens);

    render(
      <StrictMode>
        <AuthCallback />
      </StrictMode>,
    );

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
    expect(exchangeCodeForTokens).toHaveBeenCalledTimes(1);
  });
});
