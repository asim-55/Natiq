import { useEffect, useRef } from "react";

/**
 * OAuth callback page — opened in a popup by SignInModal.
 * Captures the authorization code from the URL and posts it back to the opener.
 */
export default function AuthCallbackPage() {
  const hasPosted = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasPosted.current) return;
    hasPosted.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    // Determine provider from the URL or referrer
    let provider = "";
    const url = window.location.href;
    if (document.referrer.includes("github.com") || params.get("state")?.includes("github")) {
      provider = "github";
    } else if (
      document.referrer.includes("microsoftonline.com") ||
      document.referrer.includes("login.live.com") ||
      params.get("session_state")
    ) {
      provider = "microsoft";
    }

    // Fallback: check localStorage flag set before opening popup
    if (!provider) {
      provider = sessionStorage.getItem("oauth_provider") || "github";
    }

    if (code && window.opener) {
      window.opener.postMessage({ provider, code }, window.location.origin);
      window.close();
    }
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
      <p className="text-lg">Completing sign-in...</p>
    </div>
  );
}
