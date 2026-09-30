import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";

// Layouts
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Route Protection
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Protected Pages
import DashboardPage from "./pages/DashboardPage";
import ShopsPage from "./pages/ShopsPage";
import StockPage from "./pages/StockPage";
import FinancePage from "./pages/FinancePage";
import EmployeesPage from "./pages/EmployeesPage";
import MeetingsPage from "./pages/MeetingsPage";
import ReportsPage from "./pages/ReportsPage";

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
        <Route element={<DashboardLayout />}>
          <Route path='/dashboard' element={<DashboardPage />} />
          <Route path='/dashboard/shops' element={<ShopsPage />} />
          <Route path='/dashboard/stock' element={<StockPage />} />
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
