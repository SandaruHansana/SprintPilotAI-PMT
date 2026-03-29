import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const tabs = [
  {
    to: "/",
    label: "Sprint Planner",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    to: "/sprint-plan",
    label: "Sprint Plan",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    to: "/fr05",
    label: "Task Success Prediction",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

const sidebarCss = `
  .sidebar {
    position: fixed; top: 0; left: 0; height: 100vh; width: 220px;
    background: #1e293b; border-right: 1px solid #334155;
    display: flex; flex-direction: column; padding: 24px 12px; z-index: 100;
    transition: transform 0.25s ease;
  }
  .sidebar-logo {
    display: flex; align-items: center; gap: 10px;
    padding: 0 8px 24px 8px; border-bottom: 1px solid #334155; margin-bottom: 16px;
  }
  .sidebar-logo-icon {
    width: 32px; height: 32px; background: #10b981; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .sidebar-logo-text { font-size: 13px; font-weight: 700; color: #f8fafc; letter-spacing: 0.04em; line-height: 1.2; }
  .sidebar-logo-sub { font-size: 10px; color: #64748b; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase; }
  .sidebar-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
  .sidebar-link {
    display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px;
    font-size: 13px; font-weight: 500; text-decoration: none; color: #64748b;
    transition: background 0.15s, color 0.15s; position: relative;
  }
  .sidebar-link:hover { background: #0f172a; color: #cbd5e1; }
  .sidebar-link.active { background: #064e3b; color: #10b981; font-weight: 600; }
  .sidebar-link.active::before {
    content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
    width: 3px; height: 20px; background: #10b981; border-radius: 0 99px 99px 0;
  }
  .sidebar-link-icon { flex-shrink: 0; display: flex; align-items: center; justify-content: center; opacity: 0.8; }
  .sidebar-link.active .sidebar-link-icon { opacity: 1; }
  .sidebar-footer { border-top: 1px solid #334155; padding-top: 16px; display: flex; flex-direction: column; gap: 8px; }

  .sidebar-user {
    display: flex; align-items: center; gap: 9px; padding: 8px 10px;
    border-radius: 8px; background: #0f172a; border: 1px solid #334155;
  }
  .sidebar-user-avatar {
    width: 28px; height: 28px; border-radius: 50%; background: #10b981;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0; text-transform: uppercase;
  }
  .sidebar-user-info { flex: 1; min-width: 0; }
  .sidebar-user-name { font-size: 12px; font-weight: 600; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sidebar-user-email { font-size: 10px; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .sidebar-btn-signin {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
    border: 1px solid #334155; background: #0f172a; color: #94a3b8;
    cursor: pointer; transition: border-color 0.15s, color 0.15s;
  }
  .sidebar-btn-signin:hover { border-color: #475569; color: #cbd5e1; }
  .sidebar-btn-logout {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 7px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
    border: 1px solid #334155; background: transparent; color: #64748b;
    cursor: pointer; transition: border-color 0.15s, color 0.15s, background 0.15s; width: 100%;
  }
  .sidebar-btn-logout:hover { border-color: #ef4444; color: #ef4444; background: #1a0a0a; }

  /* ── Mobile topbar ── */
  .mobile-topbar {
    display: none;
    position: fixed; top: 0; left: 0; right: 0; height: 56px;
    background: #1e293b; border-bottom: 1px solid #334155;
    align-items: center; justify-content: space-between;
    padding: 0 16px; z-index: 200;
  }
  .mobile-topbar-logo { display: flex; align-items: center; gap: 8px; }
  .mobile-topbar-logo-icon {
    width: 28px; height: 28px; background: #10b981; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
  }
  .mobile-topbar-logo-text { font-size: 14px; font-weight: 700; color: #f8fafc; }
  .mobile-hamburger {
    background: none; border: none; cursor: pointer; color: #94a3b8;
    display: flex; align-items: center; justify-content: center;
    padding: 6px; border-radius: 6px; transition: background 0.15s, color 0.15s;
  }
  .mobile-hamburger:hover { background: #334155; color: #f8fafc; }

  /* ── Drawer overlay ── */
  .mobile-overlay {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,0.5); z-index: 150;
    opacity: 0; transition: opacity 0.2s; pointer-events: none;
  }
  .mobile-overlay.open { opacity: 1; pointer-events: auto; }

  /* ── Mobile breakpoint ── */
  @media (max-width: 768px) {
    .sidebar {
      transform: translateX(-100%);
      z-index: 160; width: 260px; padding-top: 16px;
    }
    .sidebar.mobile-open {
      transform: translateX(0);
      box-shadow: 4px 0 32px rgba(0,0,0,0.5);
    }
    .mobile-topbar { display: flex; }
    .mobile-overlay { display: block; }
  }
`;

function SidebarLink({ to, icon, children, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
      onClick={onClick}
    >
      <span className="sidebar-link-icon">{icon}</span>
      {children}
    </NavLink>
  );
}

export default function Navigation() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobile() { setMobileOpen(false); }

  async function handleLogout() {
    await logout();
    closeMobile();
    navigate("/signin");
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <>
      <style>{sidebarCss}</style>

      {/* Mobile topbar */}
      <div className="mobile-topbar">
        <div className="mobile-topbar-logo">
          <div className="mobile-topbar-logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="mobile-topbar-logo-text">SprintPilotAI</span>
        </div>
        <button className="mobile-hamburger" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle menu">
          {mobileOpen
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          }
        </button>
      </div>

      {/* Tap-outside overlay */}
      <div className={`mobile-overlay${mobileOpen ? " open" : ""}`} onClick={closeMobile} />

      {/* Sidebar / drawer */}
      <nav className={`sidebar${mobileOpen ? " mobile-open" : ""}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div>
            <div className="sidebar-logo-text">SprintPilotAI</div>
            <div className="sidebar-logo-sub">Workspace</div>
          </div>
        </div>

        <div className="sidebar-nav">
          {tabs.map(({ to, label, icon }) => (
            <SidebarLink key={to} to={to} icon={icon} onClick={closeMobile}>{label}</SidebarLink>
          ))}
        </div>

        <div className="sidebar-footer">
          {user ? (
            <>
              <div className="sidebar-user">
                <div className="sidebar-user-avatar">{initials}</div>
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name">{user.firstName} {user.lastName}</div>
                  <div className="sidebar-user-email">{user.email}</div>
                </div>
              </div>
              <button className="sidebar-btn-logout" onClick={handleLogout}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </>
          ) : (
            <button className="sidebar-btn-signin" onClick={() => { navigate("/signin"); closeMobile(); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Sign In
            </button>
          )}
        </div>
      </nav>
    </>
  );
}