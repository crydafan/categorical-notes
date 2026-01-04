import { Routes, Route, Navigate } from "react-router-dom";
import { AuthPage } from "@/pages/auth-page";
import { NotesPage } from "@/pages/notes-page";
import { ProtectedRoute } from "@/components/protected-route";
import { authService } from "@/services/auth.service";
import "./index.css";

export function App() {
  return (
    <Routes>
      <Route
        path="/auth"
        element={
          authService.isAuthenticated() ? (
            <Navigate to="/" replace />
          ) : (
            <AuthPage />
          )
        }
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
