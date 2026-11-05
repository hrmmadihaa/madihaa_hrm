import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { EmployeeProfilePage } from './pages/EmployeeProfile';
import { DigitalPersonnelFiles } from './pages/DigitalPersonnelFiles';
import { Attendance } from './pages/Attendance';
import { Leave } from './pages/Leave';
import { Payroll } from './pages/Payroll';
import { Bonus } from './pages/Bonus';
import { Overtime } from './pages/Overtime';
import { Reports } from './pages/Reports';
import { Recruitment } from './pages/Recruitment';
import { Training } from './pages/Training';
import { Performance } from './pages/Performance';
import { Lifecycle } from './pages/Lifecycle';
import { UserManagement } from './pages/UserManagement';
import { Accommodation } from './pages/Accommodation';
import { WorkLocationPage } from './pages/WorkLocation';
import { OrganizationChart } from './pages/OrganizationChart';
import { FridayDuty } from './pages/FridayDuty';
import { StaffDashboard } from './pages/StaffDashboard';
import { StaffPayslip } from './pages/StaffPayslip';
import { StaffAttendance } from './pages/StaffAttendance';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="staff-dashboard" element={<StaffDashboard />} />
            <Route path="staff-attendance" element={<StaffAttendance />} />
            <Route path="staff-payslips" element={<StaffPayslip />} />
            <Route path="employees" element={<Employees />} />
            <Route path="employees/new" element={<EmployeeProfilePage />} />
            <Route path="employees/:name" element={<EmployeeProfilePage isEditing={true} />} />
            <Route path="personnel-files" element={<DigitalPersonnelFiles />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leave" element={<Leave />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="bonus" element={<Bonus />} />
            <Route path="overtime" element={<Overtime />} />
            <Route path="reports" element={<Reports />} />
            <Route path="recruitment" element={<Recruitment />} />
            <Route path="training" element={<Training />} />
            <Route path="performance" element={<Performance />} />
            <Route path="lifecycle" element={<Lifecycle />} />
            <Route path="accommodation" element={<Accommodation />} />
            <Route path="work-locations" element={<WorkLocationPage />} />
            <Route path="organization-chart" element={<OrganizationChart />} />
            <Route path="friday-duty" element={<FridayDuty />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="settings" element={<div className="p-4">Settings Module - Coming Soon</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
