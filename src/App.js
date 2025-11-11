import React, { Suspense, lazy } from "react";
import "./stylesheets/theme.css";
import "./stylesheets/alignments.css";
import "./stylesheets/textelements.css";
import "./stylesheets/form-elements.css";
import "./stylesheets/custom-components.css";
import "./stylesheets/layout.css";
import "./styles/modern.css";
import "./styles/animations.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Loader from "./components/Loader";
import { useSelector } from "react-redux";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ErrorBoundary } from "./components/modern";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

// Immediate load components (critical for initial render)
import Login from "./pages/common/Login";
import Register from "./pages/common/Register";
import Home from "./pages/common/Home";

// Lazy load components for better performance
const Quiz = lazy(() => import("./pages/user/Quiz"));
const QuizPlay = lazy(() => import("./pages/user/Quiz/QuizPlay"));
const QuizResult = lazy(() => import("./pages/user/Quiz/QuizResult"));
const Exams = lazy(() => import("./pages/admin/Exams"));
const AddEditExam = lazy(() => import("./pages/admin/Exams/AddEditExam"));
const Users = lazy(() => import("./pages/admin/Users"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));

const WriteExam = lazy(() => import("./pages/user/WriteExam"));
const UserReports = lazy(() => import("./pages/user/UserReports"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const StudyMaterial = lazy(() => import("./pages/user/StudyMaterial"));
const VideoLessons = lazy(() => import("./pages/user/VideoLessons"));
const Ranking = lazy(() => import("./pages/user/Ranking"));
const RankingErrorBoundary = lazy(() => import("./components/RankingErrorBoundary"));
const Profile = lazy(() => import("./pages/common/Profile"));

const Forum = lazy(() => import("./pages/common/Forum"));
const Test = lazy(() => import("./pages/user/Test"));
const Subscription = lazy(() => import("./pages/user/Subscription"));

const Hub = lazy(() => import("./pages/user/Hub"));
const AdminStudyMaterials = lazy(() => import("./pages/admin/StudyMaterials"));
const AdminVideos = lazy(() => import("./pages/admin/Videos"));
const AdminVideoLessons = lazy(() => import("./pages/admin/VideoLessons"));
const AdminProfile = lazy(() => import("./pages/admin/Profile"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications/AdminNotifications"));
const AdminForum = lazy(() => import("./pages/admin/Forum"));
const DebugAuth = lazy(() => import("./components/DebugAuth"));
const RankingDemo = lazy(() => import("./components/modern/RankingDemo"));
const MathTest = lazy(() => import("./components/MathTest"));

// Global error handler for CSS style errors and null reference errors
window.addEventListener('error', (event) => {
  if (event.message && (
    event.message.includes('Indexed property setter is not supported') ||
    event.message.includes('Cannot read properties of null') ||
    event.message.includes('Cannot read property \'style\'')
  )) {
    console.warn('DOM/Style Error caught and handled:', event.message);
    event.preventDefault();
    return false;
  }
});

// Handle unhandled promise rejections that might be related to style errors
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && (
    event.reason.message.includes('Indexed property setter is not supported') ||
    event.reason.message.includes('Cannot read properties of null') ||
    event.reason.message.includes('Cannot read property \'style\'')
  )) {
    console.warn('DOM/Style Promise Rejection caught and handled:', event.reason.message);
    event.preventDefault();
  }
});
// Fast loading component for lazy routes
const FastLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="text-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="absolute inset-0 rounded-full h-12 w-12 border-t-2 border-blue-300 mx-auto animate-pulse"></div>
      </div>
      <p className="text-gray-600 font-medium">Loading page...</p>
      <p className="text-gray-400 text-sm mt-2">Please wait a moment</p>
    </div>
  </div>
);

function App() {
  const { loading } = useSelector((state) => state.loader);

  // All mobile header styles removed - using new design in ProtectedRoute

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          {loading && <Loader />}
        <BrowserRouter>
        <Routes>
          {/* Common Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
          <Route path="/ranking-demo" element={<RankingDemo />} />

          {/* User Routes */}
          <Route
            path="/forum"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <Forum />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <Profile />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/profile"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <Profile />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <Subscription />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/subscription"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <Subscription />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/hub"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <Hub />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/quiz"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <Quiz />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/quiz/:id/play"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <QuizPlay />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/quiz/:id/result"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <QuizResult />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/write-exam/:id"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <WriteExam />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/reports"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <UserReports />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/study-material"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <StudyMaterial />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/video-lessons"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <VideoLessons />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/ranking"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <RankingErrorBoundary>
                    <Ranking />
                  </RankingErrorBoundary>
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <AdminDashboard />
                </Suspense>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <AdminDashboard />
                </Suspense>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <AdminProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <Users />
                </Suspense>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/exams"
            element={
              <AdminProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <Exams />
                </Suspense>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/exams/add"
            element={
              <AdminProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <AddEditExam />
                </Suspense>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/exams/edit/:id"
            element={
              <AdminProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <AddEditExam />
                </Suspense>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <AdminProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <AdminReports />
                </Suspense>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/study-materials"
            element={
              <AdminProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <AdminStudyMaterials />
                </Suspense>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/videos"
            element={
              <AdminProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <AdminVideos />
                </Suspense>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/video-lessons"
            element={
              <AdminProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <AdminVideoLessons />
                </Suspense>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/notifications"
            element={
              <AdminProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <AdminNotifications />
                </Suspense>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/forum"
            element={
              <AdminProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <AdminForum />
                </Suspense>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/profile"
            element={
              <AdminProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <AdminProfile />
                </Suspense>
              </AdminProtectedRoute>
            }
          />

          {/* Debug and Test Routes */}
          <Route
            path="/debug-auth"
            element={
              <Suspense fallback={<FastLoader />}>
                <DebugAuth />
              </Suspense>
            }
          />

          <Route
            path="/math-test"
            element={
              <Suspense fallback={<FastLoader />}>
                <MathTest />
              </Suspense>
            }
          />
        </Routes>
      </BrowserRouter>
        </LanguageProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;