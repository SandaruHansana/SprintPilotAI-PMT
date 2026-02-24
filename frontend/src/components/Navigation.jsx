import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", label: "Sprint PLanner" },
  { to: "/fr05", label: "Task Success Prediction" },
];

function Tab({ to, children }) { 
  return (
    <NavLink
      to={to}
      end={to === "/"}
      style={({ isActive }) => ({
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 20px",
        fontSize: "13px",
        fontWeight: isActive ? "600" : "400",
        letterSpacing: "0.08em",
        textDecoration: "none",
        borderRadius: "6px",
        color: isActive ? "#0f172a" : "#64748b",
        background: isActive ? "#ffffff" : "transparent",
        boxShadow: isActive
          ? "0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)"
          : "none",
        transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
      })}
      onMouseEnter={e => {
        if (!e.currentTarget.getAttribute("aria-current")) {
          e.currentTarget.style.color = "#1e293b";
          e.currentTarget.style.background = "rgba(255,255,255,0.6)";
        }
      }}
      onMouseLeave={e => {
        if (!e.currentTarget.getAttribute("aria-current")) {
          e.currentTarget.style.color = "#64748b";
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      {children}
    </NavLink>
  );
}

export default function Navigation() {
  return (
    <nav
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "2px",
        padding: "4px",
        background: "rgba(241, 245, 249, 0.9)",
        borderRadius: "10px",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        backdropFilter: "blur(8px)",
        marginBottom: "24px",
      }}
    >
      {tabs.map(({ to, label }) => (
        <Tab key={to} to={to}>
          {label}
        </Tab>
      ))}
    </nav>
  );
}
