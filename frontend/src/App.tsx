import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { Sales } from "./pages/Sales";
import { ProductsRanking } from "./pages/ProductsRanking";
import { Categories } from "./pages/Categories";
import { getToken } from "./lib/auth";

function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/sales"
        element={
          <RequireAuth>
            <Sales />
          </RequireAuth>
        }
      />
      <Route
        path="/products/sales"
        element={
          <RequireAuth>
            <ProductsRanking />
          </RequireAuth>
        }
      />
      <Route
        path="/products/orders"
        element={
          <RequireAuth>
            <ProductsRanking />
          </RequireAuth>
        }
      />
      <Route
        path="/categories"
        element={
          <RequireAuth>
            <Categories />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
