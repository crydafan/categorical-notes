import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthPage } from "@/pages/auth-page";
import { NotesPage } from "@/pages/notes-page";
import { ProtectedRoute } from "@/components/protected-route";
import { authService } from "@/services/auth.service";
import "./index.css";

export function App() {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  return (
    <Routes>
      <Route
        path="/auth"
        element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <NotesPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
