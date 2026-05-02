import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "../services/auth";
import { CrossedEyeIcon, EyeIcon, LoadingIcon } from "../components/Icon";
import { useAuth } from "../context/auth";
import { toast } from "react-toastify";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const submitHandler = async (data) => {
    setIsSubmitting(true);
    try {
      const { data: res } = await signIn(data);
      login(res?.data?.token, res?.data?.name);
      toast.success("Logged in successfully");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-8 md:p-12 border border-gray-100 dark:border-gray-800">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Login to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(submitHandler)} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                placeholder="Enter your email"
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                  errors?.email
                    ? "border-red-300 focus:border-red-500 bg-red-50"
                    : "border-gray-200 dark:border-gray-700 focus:border-indigo-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-100"
                }`}
              />
              {errors?.email?.message && (
                <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3 pr-12 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                    errors?.password
                      ? "border-red-300 focus:border-red-500 bg-red-50"
                      : "border-gray-200 dark:border-gray-700 focus:border-indigo-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-100"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300"
                >
                  {showPassword ? (
                    <EyeIcon style="w-5 h-5" />
                  ) : (
                    <CrossedEyeIcon style="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors?.password?.message && (
                <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-lg font-semibold text-base disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingIcon style="animate-spin h-5 w-5" />
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}