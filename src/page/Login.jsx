import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { signIn } from "../services/auth";
import { CrossedEyeIcon, EyeIcon, LoadingIcon } from "../components/Icon";
import { useAuth } from "../context/auth";
import { Btn, FieldError, INPUT, INPUT_ERROR, LABEL } from "../components/ui/AppUI";

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
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/app", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const submitHandler = async (data) => {
    setIsSubmitting(true);
    try {
      const { data: res } = await signIn(data);
      login(res?.data?.token, res?.data?.name);
      toast.success("Signed in");
      navigate("/app", { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Sign in failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#050505] px-4 py-16 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-mono text-[0.625rem] tracking-[0.2em] text-white/30 uppercase">
            Account
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Sign in to pick up where you left off.
          </p>
        </div>

        <div className="border border-white/[0.08] bg-[#0a0a0a] p-7 sm:p-9">
          <form onSubmit={handleSubmit(submitHandler)} className="space-y-6" noValidate>
            <div>
              <label htmlFor="email" className={LABEL}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                placeholder="you@company.com"
                aria-invalid={Boolean(errors?.email)}
                aria-describedby={errors?.email ? "email-error" : undefined}
                className={`${INPUT} ${errors?.email ? INPUT_ERROR : ""}`}
              />
              <FieldError id="email-error">{errors?.email?.message}</FieldError>
            </div>

            <div>
              <label htmlFor="password" className={LABEL}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
                  placeholder="••••••••"
                  aria-invalid={Boolean(errors?.password)}
                  aria-describedby={errors?.password ? "password-error" : undefined}
                  className={`${INPUT} pr-12 ${errors?.password ? INPUT_ERROR : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 transition-colors hover:text-white"
                >
                  {showPassword ? (
                    <EyeIcon style="w-5 h-5" />
                  ) : (
                    <CrossedEyeIcon style="w-5 h-5" />
                  )}
                </button>
              </div>
              <FieldError id="password-error">{errors?.password?.message}</FieldError>
            </div>

            <Btn type="submit" disabled={isSubmitting} className="w-full !py-3.5">
              {isSubmitting ? (
                <>
                  <LoadingIcon style="animate-spin h-4 w-4" />
                  <span>Signing in…</span>
                </>
              ) : (
                "Sign in"
              )}
            </Btn>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-white/45">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="nav-link text-white hover:text-[#ff9933]">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
