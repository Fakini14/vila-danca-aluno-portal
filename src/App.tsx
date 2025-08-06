
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Auth from "./pages/Auth";
import Confirm from "./pages/auth/Confirm";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import NotFound from "./pages/NotFound";

// Admin Layout and Pages
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminStudents from "./pages/admin/Students";
import AdminStudentDetail from "./pages/admin/StudentDetail";
import AdminTeachers from "./pages/admin/Teachers";
import AdminClasses from "./pages/admin/Classes";
import AdminNewClass from "./pages/admin/NewClass";
import AdminClassTypes from "./pages/admin/ClassTypes";
import AdminFinance from "./pages/admin/Finance";
import AdminEvents from "./pages/admin/Events";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";
import AdminUserRoles from "./pages/admin/UserRoles";

// Checkout Pages
import { CheckoutPage } from "./components/checkout/CheckoutPage";
import { CheckoutSuccess } from "./components/checkout/CheckoutSuccess";
import { CheckoutFailure } from "./components/checkout/CheckoutFailure";
import CheckoutSuccessNew from "./pages/checkout/CheckoutSuccess";
import CheckoutCancel from "./pages/checkout/CheckoutCancel";
import CheckoutExpired from "./pages/checkout/CheckoutExpired";

// Teacher Layout and Pages
import TeacherLayout from "./layouts/TeacherLayout";
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherClasses from "./pages/teacher/Classes";
import TeacherStudents from "./pages/teacher/Students";

// Student Layout and Pages
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboardPage from "./pages/student/Dashboard";
import StudentClassesPage from "./pages/student/Classes";
import StudentPaymentsPage from "./pages/student/Payments";

// Protected Route Component
import ProtectedRoute from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/confirm" element={<Confirm />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/change-password" element={<ChangePassword />} />
            
            {/* Checkout Routes */}
            <Route path="/checkout/:paymentId" element={<CheckoutPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessNew />} />
            <Route path="/checkout/cancel" element={<CheckoutCancel />} />
            <Route path="/checkout/expired" element={<CheckoutExpired />} />
            <Route path="/checkout/failure" element={<CheckoutFailure />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin', 'funcionario']}>
                <ErrorBoundary>
                  <AdminLayout />
                </ErrorBoundary>
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="students/:id" element={<AdminStudentDetail />} />
              <Route path="teachers" element={<AdminTeachers />} />
              <Route path="classes" element={<AdminClasses />} />
              <Route path="classes/new" element={<AdminNewClass />} />
              <Route path="class-types" element={<AdminClassTypes />} />
              <Route path="finance" element={<AdminFinance />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="user-roles" element={<AdminUserRoles />} />
            </Route>

            {/* Teacher Routes */}
            <Route path="/teacher" element={
              <ProtectedRoute allowedRoles={['professor']}>
                <TeacherLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/teacher/dashboard" replace />} />
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="classes" element={<TeacherClasses />} />
              <Route path="students" element={<TeacherStudents />} />
            </Route>

            {/* Student Routes */}
            <Route path="/student" element={
              <ProtectedRoute allowedRoles={['aluno']}>
                <ErrorBoundary>
                  <StudentLayout />
                </ErrorBoundary>
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboardPage />} />
              <Route path="classes" element={<StudentClassesPage />} />
              <Route path="payments" element={<StudentPaymentsPage />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
