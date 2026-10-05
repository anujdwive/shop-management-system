import { useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";

// Layouts
import PublicLayout from "./layouts/PublicLayout";

// Route Protection
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Protected Pages
import StockAndProManagement from "./components/screen/stockAndProductManagement/StockAndProManagement";
import ProtectedLayout from "./layouts/ProtectedLayout";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import FinancePage from "./pages/FinancePage";
import MeetingsPage from "./pages/MeetingsPage";
import ReportsPage from "./pages/ReportsPage";
import ShopsPage from "./pages/ShopsPage";

const App = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <Routes>
      {/* ================= PUBLIC ROUTES ================= */}

      <Route element={<PublicLayout />}>
        <Route
          path='/login'
          element={
            isAuthenticated ? (
              <Navigate to='/dashboard' replace />
            ) : (
              <LoginPage />
            )
          }
        />

        <Route
          path='/register'
          element={
            isAuthenticated ? (
              <Navigate to='/dashboard' replace />
            ) : (
              <RegisterPage />
            )
          }
        />
      </Route>

      {/* ================= PROTECTED ROUTES ================= */}

      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedLayout />}>
          <Route path='/dashboard' element={<DashboardPage />} />
          <Route path='/dashboard/shops' element={<ShopsPage />} />
          <Route path='/dashboard/stock' element={<StockAndProManagement />} />
          <Route path='/dashboard/finance' element={<FinancePage />} />
          <Route path='/dashboard/employees' element={<EmployeesPage />} />
          <Route path='/dashboard/meetings' element={<MeetingsPage />} />
          <Route path='/dashboard/reports' element={<ReportsPage />} />
        </Route>
      </Route>

      {/* ================= ROOT ================= */}

      <Route
        path='/'
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        }
      />

      {/* ================= UNKNOWN ROUTE ================= */}

      <Route
        path='*'
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        }
      />
    </Routes>
  );
};

export default App;
