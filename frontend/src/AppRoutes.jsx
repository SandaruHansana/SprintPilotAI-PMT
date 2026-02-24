import { Routes, Route, Navigate } from "react-router-dom";
import SprintPlanner from "./pages/SprintPlanner";
import FR04 from "./pages/FR04";
import FR05 from "./pages/FR05";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SprintPlanner />} />
      <Route path="/fr05" element={<FR05 />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}