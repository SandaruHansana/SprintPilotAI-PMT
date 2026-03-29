import { BrowserRouter } from "react-router-dom";
import Navigation from "./components/Navigation";
import AppRoutes from "./AppRoutes";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50">
          {/* Fixed header with Navigation */}
          <header className="fixed top-0 left-0 w-full bg-white border-b border-slate-200 shadow-sm z-10">
            <div className="mx-auto max-w-6xl px-4 py-3">
              <Navigation />
            </div>
          </header>

          {/* Main content – pushed down to avoid header overlap */}
          <main className="pt-20">
            <div className="mx-auto max-w-6xl px-4 py-6">
              <AppRoutes />
            </div>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}