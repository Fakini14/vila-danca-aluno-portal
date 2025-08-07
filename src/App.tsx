
import { lazy, Suspense } from "react";
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

// Checkout Pages (loaded immediately for payment flow)
import { CheckoutPage } from "./components/checkout/CheckoutPage";
import { CheckoutSuccess } from "./components/checkout/CheckoutSuccess";
import { CheckoutFailure } from "./components/checkout/CheckoutFailure";
import CheckoutSuccessNew from "./pages/checkout/CheckoutSuccess";
import CheckoutCancel from "./pages/checkout/CheckoutCancel";
import CheckoutExpired from "./pages/checkout/CheckoutExpired";

// Admin Layout and Pages - Lazy loaded
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminStudents = lazy(() => import("./pages/admin/Students"));
const AdminStudentDetail = lazy(() => import("./pages/admin/StudentDetail"));
const AdminTeachers = lazy(() => import("./pages/admin/Teachers"));
const AdminClasses = lazy(() => import("./pages/admin/Classes"));
const AdminNewClass = lazy(() => import("./pages/admin/NewClass"));
const AdminClassTypes = lazy(() => import("./pages/admin/ClassTypes"));
const AdminFinance = lazy(() => import("./pages/admin/Finance"));
const AdminEvents = lazy(() => import("./pages/admin/Events"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminUserRoles = lazy(() => import("./pages/admin/UserRoles"));

// Teacher Layout and Pages - Lazy loaded
const TeacherLayout = lazy(() => import("./layouts/TeacherLayout"));
const TeacherDashboard = lazy(() => import("./pages/teacher/Dashboard"));
const TeacherClasses = lazy(() => import("./pages/teacher/Classes"));
const TeacherStudents = lazy(() => import("./pages/teacher/Students"));

// Student Layout and Pages - Lazy loaded
const StudentLayout = lazy(() => import("./layouts/StudentLayout"));
const StudentDashboardPage = lazy(() => import("./pages/student/Dashboard"));
const StudentClassesPage = lazy(() => import("./pages/student/Classes"));
const StudentPaymentsPage = lazy(() => import("./pages/student/Payments"));

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
                  <Suspense fallback={<div className="flex items-center justify-center h-screen">Carregando...</div>}>
                    <AdminLayout />
                  </Suspense>
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
                <Suspense fallback={<div className="flex items-center justify-center h-screen">Carregando...</div>}>
                  <TeacherLayout />
                </Suspense>
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
                  <Suspense fallback={<div className="flex items-center justify-center h-screen">Carregando...</div>}>
                    <StudentLayout />
                  </Suspense>
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
