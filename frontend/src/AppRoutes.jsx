import { Routes, Route, Navigate } from "react-router-dom";
import SprintPlanner from "./pages/SprintPlanner";
import FR05 from "./pages/FR05";
import SprintPlanPage from "./pages/SprintPlanPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SprintPlanner />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/fr05" element={<FR05 />} />
      <Route path="/sprint-plan" element={<SprintPlanPage />} />
      <Route path="/sprint-plan/:id" element={<SprintPlanPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}