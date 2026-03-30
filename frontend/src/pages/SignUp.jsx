import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function cx(...classes) { return classes.filter(Boolean).join(" "); }

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; }
  .page { min-height: 100vh; background: #0f172a; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .auth-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; width: 100%; max-width: 420px; }
  .auth-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
  .auth-logo-icon { width: 36px; height: 36px; background: #064e3b; border: 1px solid #065f46; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  .auth-logo-icon svg { width: 18px; height: 18px; stroke: #10b981; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .auth-logo-name { font-size: 15px; font-weight: 700; color: #fff; }
  .auth-logo-tag { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #10b981; }
  .auth-heading { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 6px; }
  .auth-sub { font-size: 13px; color: #64748b; margin-bottom: 28px; }
  .field-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .field { margin-bottom: 16px; }
  .field label { display: block; font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
  .field input { width: 100%; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 10px 14px; font-size: 14px; color: #f1f5f9; outline: none; transition: border-color 0.15s; }
  .field input::placeholder { color: #475569; }
  .field input:focus { border-color: #10b981; }
  .field input.has-toggle { padding-right: 40px; }
  .field input.invalid { border-color: #ef4444; }
  .input-wrap { position: relative; }
  .toggle-pw { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #475569; display: flex; align-items: center; }
  .toggle-pw:hover { color: #94a3b8; }
  .toggle-pw svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .pw-strength { margin-top: 8px; }
  .pw-strength-bar { display: flex; gap: 4px; margin-bottom: 4px; }
  .pw-segment { flex: 1; height: 3px; border-radius: 99px; background: #334155; transition: background 0.2s; }
  .pw-segment.weak { background: #ef4444; }
  .pw-segment.fair { background: #f59e0b; }
  .pw-segment.strong { background: #10b981; }
  .pw-strength-label { font-size: 11px; color: #64748b; }
  .hint { font-size: 11px; color: #475569; margin-top: 5px; }
  .hint.match { color: #10b981; }
  .hint.no-match { color: #ef4444; }
  .btn-primary { width: 100%; background: #10b981; border: none; border-radius: 8px; padding: 11px; font-size: 14px; font-weight: 600; color: #fff; cursor: pointer; margin-top: 8px; transition: background 0.15s, opacity 0.15s; }
  .btn-primary:hover { background: #059669; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
  .divider-line { flex: 1; height: 1px; background: #334155; }
  .divider span { font-size: 12px; color: #475569; }
  .error-msg { background: #450a0a22; border: 1px solid #7f1d1d; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #fca5a5; margin-bottom: 16px; }
  .auth-footer { margin-top: 24px; text-align: center; font-size: 13px; color: #64748b; }
  .auth-footer a { color: #10b981; text-decoration: none; cursor: pointer; background: none; border: none; font-size: 13px; }
  .auth-footer a:hover { color: #6ee7b7; }
`;

function getStrength(pw) {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
}
const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthClass = (i, score) => {
    if (!score) return "";
    if (score === 1 && i === 0) return "weak";
    if (score === 2 && i < 2) return "fair";
    if (score >= 3 && i < score) return "strong";
    return "";
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SignUpPage() {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "" });
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const strength = getStrength(form.password);
    const passwordsMatch = form.confirm && form.password === form.confirm;
    const passwordsMismatch = form.confirm && form.password !== form.confirm;

    function set(field) { return e => setForm(prev => ({ ...prev, [field]: e.target.value })); }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirm) { setError("Please fill in all fields."); return; }
        if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
        if (strength < 2) { setError("Please choose a stronger password."); return; }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message || "Registration failed. Please try again."); return; }

            //  Update global auth state immediately — Navigation updates instantly
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

                <h1 className="auth-heading">Create your account</h1>
                <p className="auth-sub">Start planning your sprints in minutes</p>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="field-row-2">
                        <div className="field"><label>First name</label><input type="text" placeholder="Jane" value={form.firstName} onChange={set("firstName")} autoComplete="given-name" /></div>
                        <div className="field"><label>Last name</label><input type="text" placeholder="Doe" value={form.lastName} onChange={set("lastName")} autoComplete="family-name" /></div>
                    </div>
                    <div className="field"><label>Email</label><input type="email" placeholder="you@company.com" value={form.email} onChange={set("email")} autoComplete="email" /></div>
                    <div className="field">
                        <label>Password</label>
                        <div className="input-wrap">
                            <input type={showPw ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={set("password")} className="has-toggle" autoComplete="new-password" />
                            <button type="button" className="toggle-pw" onClick={() => setShowPw(v => !v)}>
                                {showPw ? <svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                    : <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
                            </button>
                        </div>
                        {form.password && (
                            <div className="pw-strength">
                                <div className="pw-strength-bar">{[0, 1, 2, 3].map(i => <div key={i} className={cx("pw-segment", strengthClass(i, strength))} />)}</div>
                                <p className="pw-strength-label">{strengthLabels[strength]}</p>
                            </div>
                        )}
                    </div>
                    <div className="field">
                        <label>Confirm password</label>
                        <div className="input-wrap">
                            <input type={showConfirm ? "text" : "password"} placeholder="••••••••" value={form.confirm} onChange={set("confirm")} className={cx("has-toggle", passwordsMismatch ? "invalid" : "")} autoComplete="new-password" />
                            <button type="button" className="toggle-pw" onClick={() => setShowConfirm(v => !v)}>
                                {showConfirm ? <svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                    : <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
                            </button>
                        </div>
                        {passwordsMatch && <p className="hint match">✓ Passwords match</p>}
                        {passwordsMismatch && <p className="hint no-match">Passwords do not match</p>}
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Creating account…" : "Create account"}</button>
                </form>

                <div className="divider"><div className="divider-line" /><span>or</span><div className="divider-line" /></div>
                <p className="auth-footer">Already have an account?{" "}<a onClick={() => navigate("/signin")}>Sign in</a></p>
            </div>
        </div>
    );
}