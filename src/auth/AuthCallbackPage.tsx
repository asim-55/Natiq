import { useEffect, useRef } from "react";

// Global flag to prevent duplicate postMessage across all renders/instances
let hasPostedGlobally = false;

/**
 * OAuth callback page — opened in a popup by SignInModal.
 * Captures the authorization code from the URL and posts it back to the opener.
 */
export default function AuthCallbackPage() {
  const hasPosted = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode (both local and global guards)
    if (hasPosted.current || hasPostedGlobally) {
      console.log("[AuthCallback] Already posted message, skipping duplicate");
      return;
    }
    hasPosted.current = true;
    hasPostedGlobally = true;

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
      console.log(`[AuthCallback] Posting ${provider} OAuth code to parent:`, code.substring(0, 10) + "...");
      
      // Post message to parent window
      window.opener.postMessage({ provider, code }, window.location.origin);
      
      // Close popup immediately to prevent any duplicate messages
      setTimeout(() => {
        window.close();
      }, 100);
    } else {
      console.error("[AuthCallback] Missing code or opener window");
    }
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
      <p className="text-lg">Completing sign-in...</p>
    </div>
  );
}
