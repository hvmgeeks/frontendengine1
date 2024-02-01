import React from "react";
import "./stylesheets/theme.css";
import "./stylesheets/alignments.css";
import "./stylesheets/textelements.css";
import "./stylesheets/custom-components.css";
import "./stylesheets/form-elements.css";
import "./stylesheets/layout.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/common/Login";
import Register from "./pages/common/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Quiz from "./pages/user/Quiz";
import Exams from "./pages/admin/Exams";
import AddEditExam from "./pages/admin/Exams/AddEditExam";
import Loader from "./components/Loader";
import { useSelector } from "react-redux";
import WriteExam from "./pages/user/WriteExam";
import UserReports from "./pages/user/UserReports";
import AdminReports from "./pages/admin/AdminReports";
import StudyMaterial from "./pages/user/StudyMaterial";
import Ranking from "./pages/user/Ranking";
import Profile from "./pages/common/Profile";
import AboutUs from "./pages/user/AboutUs";
import Forum from "./pages/user/Forum";
import Home from "./pages/common/Home";

function App() {
  const { loading } = useSelector((state) => state.loader);
  return (
    <>
      {loading && <Loader />}
      <BrowserRouter>
        <Routes>
          {/* Common Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />

          {/* User Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/quiz"
            element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/write-exam/:id"
            element={
              <ProtectedRoute>
                <WriteExam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/reports"
            element={
              <ProtectedRoute>
                <UserReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/study-material"
            element={
              <ProtectedRoute>
                <StudyMaterial />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/ranking"
            element={
              <ProtectedRoute>
                <Ranking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/about-us"
            element={
              <ProtectedRoute>
                <AboutUs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/forum"
            element={
              <ProtectedRoute>
                <Forum />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/exams"
            element={
              <ProtectedRoute>
                <Exams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams/add"
            element={
              <ProtectedRoute>
                <AddEditExam />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/exams/edit/:id"
            element={
              <ProtectedRoute>
                <AddEditExam />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <AdminReports />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;