import { NavLink, useNavigate } from "react-router-dom";

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
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 220px;
    background: #1e293b;
    border-right: 1px solid #334155;
    display: flex;
    flex-direction: column;
    padding: 24px 12px;
    z-index: 100;
  }

  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 8px 24px 8px;
    border-bottom: 1px solid #334155;
    margin-bottom: 16px;
  }

  .sidebar-logo-icon {
    width: 32px;
    height: 32px;
    background: #10b981;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .sidebar-logo-text {
    font-size: 13px;
    font-weight: 700;
    color: #f8fafc;
    letter-spacing: 0.04em;
    line-height: 1.2;
  }

  .sidebar-logo-sub {
    font-size: 10px;
    color: #64748b;
    font-weight: 400;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .sidebar-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #475569;
    padding: 0 8px;
    margin-bottom: 6px;
    margin-top: 4px;
  }

  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    color: #64748b;
    transition: background 0.15s, color 0.15s;
    position: relative;
  }

  .sidebar-link:hover {
    background: #0f172a;
    color: #cbd5e1;
  }

  .sidebar-link.active {
    background: #064e3b;
    color: #10b981;
    font-weight: 600;
  }

  .sidebar-link.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 20px;
    background: #10b981;
    border-radius: 0 99px 99px 0;
  }

  .sidebar-link-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.8;
  }

  .sidebar-link.active .sidebar-link-icon {
    opacity: 1;
  }

  .sidebar-footer {
    border-top: 1px solid #334155;
    padding-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .sidebar-footer-version {
    font-size: 11px;
    color: #475569;
    padding-left: 8px;
    letter-spacing: 0.04em;
    margin-bottom: 2px;
  }

  .sidebar-btn-signin {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    border: 1px solid #334155;
    background: #0f172a;
    color: #94a3b8;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }

  .sidebar-btn-signin:hover {
    border-color: #475569;
    color: #cbd5e1;
  }

  .sidebar-btn-signup {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    border: none;
    background: #10b981;
    color: #fff;
    cursor: pointer;
    transition: background 0.15s;
  }

  .sidebar-btn-signup:hover {
    background: #059669;
  }
`;

function SidebarLink({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
    >
      <span className="sidebar-link-icon">{icon}</span>
      {children}
    </NavLink>
  );
}

export default function Navigation() {
  const navigate = useNavigate();
  return (
    <>
      <style>{sidebarCss}</style>
      <nav className="sidebar">
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
            <SidebarLink key={to} to={to} icon={icon}>
              {label}
            </SidebarLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-btn-signin" onClick={() => navigate("/signin")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Sign In
          </button>
        </div>
      </nav>
    </>
  );
}