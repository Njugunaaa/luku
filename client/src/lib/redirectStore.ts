/**
 * Simple redirect store to track where users were trying to go
 * when they got redirected to login. After login, they're sent back.
 */

class RedirectStore {
  private key = "__auth_redirect_url";

  /**
   * Save the URL the user was trying to access
   */
  setRedirect(url: string) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(this.key, url);
    }
  }

  /**
   * Get the saved redirect URL and clear it
   */
  getAndClear(): string | null {
    if (typeof window === "undefined") return null;
    const url = sessionStorage.getItem(this.key);
    sessionStorage.removeItem(this.key);
    return url;
  }

  /**
   * Returns a customer-safe redirect target after authentication.
   * Falls back when the stored route is missing or would lead to an admin-only page.
   */
  consumeForSignedInUser(fallback = "/dashboard") {
    const url = this.getAndClear();
    if (!url || url === "/login" || url.startsWith("/admin")) {
      return fallback;
    }
    return url;
  }

  /**
   * Clear the redirect URL without returning it
   */
  clear() {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(this.key);
    }
  }
}

export const redirectStore = new RedirectStore();
