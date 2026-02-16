import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import FR01 from "./pages/FR01";
import FR02 from "./pages/FR02";
import FR03 from "./pages/FR03";
import FR04 from "./pages/FR04";
import FR05 from "./pages/FR05";

function Tab({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-xl px-3 py-2 text-sm font-semibold ${
          isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="mb-6 flex flex-wrap gap-2">
            <Tab to="/">FR01</Tab>
            <Tab to="/fr02">FR02</Tab>
            <Tab to="/fr03">FR03</Tab>
            <Tab to="/fr04">FR04</Tab>
            <Tab to="/fr05">FR05</Tab>
          </div>

          <Routes>
            <Route path="/" element={<FR01 />} />
            <Route path="/fr02" element={<FR02 />} />
            <Route path="/fr03" element={<FR03 />} />
            <Route path="/fr04" element={<FR04 />} />
            <Route path="/fr05" element={<FR05 />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
