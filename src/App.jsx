import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Flip, ToastContainer } from "react-toastify";
import Nav from "./components/Nav";
import { AuthProvider } from "./context/auth";
import ProtectedRoute from "./components/ProtectedRoute";
import { lazy, Suspense, useEffect, useState } from "react";
import LoadingSpinner from "./components/LoadingSpinner";

const Home = lazy(() => import("./page/Home"));
const Image = lazy(() => import("./page/Image"));
const Content = lazy(() => import("./page/Content"));
const SignUp = lazy(() => import("./page/SignUp"));
const Login = lazy(() => import("./page/Login"));
const GenerateImage = lazy(() => import("./page/GenerateImage"));
const GenerateContent = lazy(() => import("./page/GenerateContent"));
const ImageHistory = lazy(() => import("./page/ImageHistory"));
const ContentHistory = lazy(() => import("./page/ContentHistory"));
const ContentDetails = lazy(() => import("./page/ContentDetails"));

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
        transition={Flip}
      />
      <AuthProvider>
        <Nav theme={theme} toggleTheme={toggleTheme} />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home />}></Route>
            <Route path="/login" element={<Login />}></Route>
            <Route path="/register" element={<SignUp />}></Route>
            <Route
              path="/image"
              element={
                <ProtectedRoute>
                  <Image />
                </ProtectedRoute>
              }
            ></Route>
            <Route
              path="/image/generate"
              element={
                <ProtectedRoute>
                  <GenerateImage />
                </ProtectedRoute>
              }
            ></Route>
            <Route
              path="/image/history"
              element={
                <ProtectedRoute>
                  <ImageHistory />
                </ProtectedRoute>
              }
            ></Route>
            <Route
              path="/content"
              element={
                <ProtectedRoute>
                  <Content />
                </ProtectedRoute>
              }
            ></Route>
            <Route
              path="/content/:action"
              element={
                <ProtectedRoute>
                  <GenerateContent />
                </ProtectedRoute>
              }
            ></Route>
            <Route
              path="/content/history"
              element={
                <ProtectedRoute>
                  <ContentHistory />
                </ProtectedRoute>
              }
            ></Route>
            <Route
              path="/content-details/:id"
              element={
                <ProtectedRoute>
                  <ContentDetails />
                </ProtectedRoute>
              }
            ></Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;