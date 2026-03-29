import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; }
  .page { min-height: 100vh; background: #0f172a; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .auth-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; width: 100%; max-width: 400px; }
  .auth-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
  .auth-logo-icon { width: 36px; height: 36px; background: #064e3b; border: 1px solid #065f46; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  .auth-logo-icon svg { width: 18px; height: 18px; stroke: #10b981; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .auth-logo-name { font-size: 15px; font-weight: 700; color: #fff; }
  .auth-logo-tag { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #10b981; }
  .auth-heading { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 6px; }
  .auth-sub { font-size: 13px; color: #64748b; margin-bottom: 28px; }
  .field { margin-bottom: 16px; }
  .field label { display: block; font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
  .field input { width: 100%; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 10px 14px; font-size: 14px; color: #f1f5f9; outline: none; transition: border-color 0.15s; }
  .field input::placeholder { color: #475569; }
  .field input:focus { border-color: #10b981; }
  .field-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .field-row label { margin-bottom: 0; }
  .forgot-link { font-size: 12px; color: #10b981; text-decoration: none; cursor: pointer; background: none; border: none; }
  .forgot-link:hover { color: #6ee7b7; }
  .btn-primary { width: 100%; background: #10b981; border: none; border-radius: 8px; padding: 11px; font-size: 14px; font-weight: 600; color: #fff; cursor: pointer; margin-top: 8px; transition: background 0.15s, opacity 0.15s; }
  .btn-primary:hover { background: #059669; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
  .divider-line { flex: 1; height: 1px; background: #334155; }
  .divider span { font-size: 12px; color: #475569; }
  .auth-footer { margin-top: 24px; text-align: center; font-size: 13px; color: #64748b; }
  .auth-footer a { color: #10b981; text-decoration: none; cursor: pointer; background: none; border: none; font-size: 13px; }
  .auth-footer a:hover { color: #6ee7b7; }
  .error-msg { background: #450a0a22; border: 1px solid #7f1d1d; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #fca5a5; margin-bottom: 16px; }
  .input-wrap { position: relative; }
  .toggle-pw { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #475569; display: flex; align-items: center; }
  .toggle-pw:hover { color: #94a3b8; }
  .toggle-pw svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .field input.has-toggle { padding-right: 40px; }
`;

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SignInPage() {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        if (!email || !password) { setError("Please fill in all fields."); return; }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message || "Sign in failed. Please try again."); return; }

            // ✅ Update global auth state immediately — Navigation updates instantly
            setUser(data.user);
            navigate("/");
        } catch {
            setError("Could not connect to the server. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page">
            <style>{css}</style>
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                    </div>
                    <div>
                        <p className="auth-logo-name">SprintPilotAI</p>
                        <p className="auth-logo-tag">Workspace</p>
                    </div>
                </div>

                <h1 className="auth-heading">Welcome back</h1>
                <p className="auth-sub">Sign in to continue to your sprint planner</p>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label>Email</label>
                        <input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                    </div>
                    <div className="field">
                        <div className="field-row">
                            <label>Password</label>
                            <button type="button" className="forgot-link">Forgot password?</button>
                        </div>
                        <div className="input-wrap">
                            <input type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" className="has-toggle" />
                            <button type="button" className="toggle-pw" onClick={() => setShowPw(v => !v)}>
                                {showPw
                                    ? <svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                    : <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                }
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
                </form>

                <div className="divider"><div className="divider-line" /><span>or</span><div className="divider-line" /></div>
                <p className="auth-footer">Don't have an account?{" "}<a onClick={() => navigate("/signup")}>Create one</a></p>
            </div>
        </div>
    );
}