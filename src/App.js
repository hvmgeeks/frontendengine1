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
const Skills = lazy(() => import("./pages/user/Skills"));
const Ranking = lazy(() => import("./pages/user/Ranking"));
const RankingErrorBoundary = lazy(() => import("./components/RankingErrorBoundary"));
const Profile = lazy(() => import("./pages/common/Profile"));

const Forum = lazy(() => import("./pages/common/Forum"));
const Test = lazy(() => import("./pages/user/Test"));
const Subscription = lazy(() => import("./pages/user/Subscription"));

const Hub = lazy(() => import("./pages/user/Hub"));
const AdminStudyMaterials = lazy(() => import("./pages/admin/StudyMaterials"));
const AdminSkills = lazy(() => import("./pages/admin/Skills"));
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



          <Route path="/test" element={
            <Suspense fallback={<FastLoader />}>
              <Test />
            </Suspense>
          } />
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

          {/* User Routes */}
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
            path="/quiz/:id/result"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <QuizResult />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* New Quiz Routes */}

          <Route
            path="/quiz/:id/play"
            element={
              <ProtectedRoute>
                <QuizPlay />
              </ProtectedRoute>
            }
          />

          {/* Math Test Route */}
          <Route
            path="/math-test"
            element={
              <Suspense fallback={<FastLoader />}>
                <MathTest />
              </Suspense>
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
            path="/user/skills"
            element={
              <ProtectedRoute>
                <Suspense fallback={<FastLoader />}>
                  <Skills />
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
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <Users />
                </AdminProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams"
            element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <Exams />
                </AdminProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams/add"
            element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <AddEditExam />
                </AdminProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/exams/edit/:id"
            element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <AddEditExam />
                </AdminProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/study-materials"
            element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <AdminStudyMaterials />
                </AdminProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/skills"
            element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <AdminSkills />
                </AdminProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/videos"
            element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <AdminVideos />
                </AdminProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/video-lessons"
            element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <AdminVideoLessons />
                </AdminProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <AdminReports />
                </AdminProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <AdminNotifications />
                </AdminProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <AdminProfile />
                </AdminProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/forum"
            element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <AdminForum />
                </AdminProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/debug"
            element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <DebugAuth />
                </AdminProtectedRoute>
              </ProtectedRoute>
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