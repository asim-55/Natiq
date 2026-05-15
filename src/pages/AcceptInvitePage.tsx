import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { acceptInvite } from "../api/client";
import SignInModal from "../auth/SignInModal";

export default function AcceptInvitePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "unauthenticated">("loading");
  const [message, setMessage] = useState("");
  const [signInOpen, setSignInOpen] = useState(false);

  const rawToken = params.get("token") ?? "";

  useEffect(() => {
    if (!rawToken) {
      setStatus("error");
      setMessage("Invalid invite link.");
      return;
    }
    if (!token) {
      setStatus("unauthenticated");
      return;
    }

    setStatus("loading");
    acceptInvite(token, rawToken)
      .then(org => {
        setStatus("success");
        setMessage(`You've joined ${org.display_name}!`);
        setTimeout(() => navigate("/dashboard/organization", { replace: true }), 2000);
      })
      .catch(err => {
        setStatus("error");
        setMessage(err.message || "Invalid or expired invitation.");
      });
  }, [token, rawToken]);

  return (
    <div className="min-h-screen bg-[#060d18] flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 size={36} className="animate-spin text-cyan-300 mx-auto mb-4" />
            <p className="text-sm text-slate-400">Accepting invitation…</p>
          </>
        )}
        {status === "unauthenticated" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10">
              <Loader2 size={24} className="text-cyan-300" />
            </div>
            <h2 className="text-base font-semibold text-white mb-2">Sign in to accept invitation</h2>
            <p className="text-sm text-slate-400 mb-5">
              You need an account to join this organization. Sign in or create one — the invite will be accepted automatically.
            </p>
            <button
              onClick={() => setSignInOpen(true)}
              className="rounded-2xl bg-cyan-300 px-6 py-2.5 text-sm font-semibold text-ink-950 hover:bg-cyan-200"
            >
              Sign in / Create account
            </button>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle size={36} className="text-cyan-300 mx-auto mb-4" />
            <h2 className="text-base font-semibold text-white mb-2">Invitation accepted!</h2>
            <p className="text-sm text-slate-400">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={36} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-base font-semibold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-400 mb-5">{message}</p>
            <button
              onClick={() => navigate("/", { replace: true })}
              className="rounded-2xl bg-white/10 border border-white/10 px-5 py-2.5 text-sm text-white hover:bg-white/15"
            >
              Go home
            </button>
          </>
        )}
      </div>

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </div>
  );
}
