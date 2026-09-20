import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Flip, ToastContainer } from "react-toastify";
import Nav from "./components/Nav";
import { AuthProvider } from "./context/auth";
import ProtectedRoute from "./components/ProtectedRoute";
import { lazy, Suspense, useEffect } from "react";
import LoadingSpinner from "./components/LoadingSpinner";

const Landing = lazy(() => import("./page/Landing"));
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
const Tools = lazy(() => import("./page/tools/Tools"));
const MergePdf = lazy(() => import("./page/tools/MergePdf"));
const SplitPdf = lazy(() => import("./page/tools/SplitPdf"));
const Convert = lazy(() => import("./page/tools/Convert"));
const AdminLayout = lazy(() => import("./page/admin/AdminLayout"));
const Dashboard = lazy(() => import("./page/admin/Dashboard"));
const ResourcePage = lazy(() => import("./page/admin/ResourcePage"));

/**
 * The marketing landing page and the CMS admin both ship their own chrome, so
 * the product navigation is suppressed there.
 */
const CHROMELESS = [/^\/$/, /^\/admin(\/|$)/];

function AppChrome() {
  const { pathname } = useLocation();
  if (CHROMELESS.some((pattern) => pattern.test(pathname))) return null;
  return <Nav />;
}

function App() {
  // One dark system across marketing, product and admin. The "dark" class is
  // pinned so any remaining "dark:" utilities resolve to the same palette.
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }, []);

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
        theme="dark"
        transition={Flip}
      />
      <AuthProvider>
        <AppChrome />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Marketing */}
            <Route path="/" element={<Landing />}></Route>

            {/* Product */}
            <Route path="/app" element={<Home />}></Route>
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

            {/* Toolkit — client-side document utilities, no API calls */}
            <Route
              path="/tools"
              element={
                <ProtectedRoute>
                  <Tools />
                </ProtectedRoute>
              }
            ></Route>
            <Route
              path="/tools/merge-pdf"
              element={
                <ProtectedRoute>
                  <MergePdf />
                </ProtectedRoute>
              }
            ></Route>
            <Route
              path="/tools/split-pdf"
              element={
                <ProtectedRoute>
                  <SplitPdf />
                </ProtectedRoute>
              }
            ></Route>
            <Route
              path="/tools/convert"
              element={
                <ProtectedRoute>
                  <Convert />
                </ProtectedRoute>
              }
            ></Route>

            {/* CMS admin — reuses the app's existing JWT auth guard */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />}></Route>
              <Route path=":resource" element={<ResourcePage />}></Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
