import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { signUp } from "../services/auth";
import { CrossedEyeIcon, EyeIcon, LoadingIcon } from "../components/Icon";
import { useAuth } from "../context/auth";
import { Btn, FieldError, INPUT, INPUT_ERROR, LABEL } from "../components/ui/AppUI";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ),
});

/** Mirrors the schema so the requirements are visible before submitting. */
const RULES = [
  { label: "8+ characters", test: (value) => value.length >= 8 },
  { label: "Uppercase", test: (value) => /[A-Z]/.test(value) },
  { label: "Lowercase", test: (value) => /[a-z]/.test(value) },
  { label: "Number", test: (value) => /[0-9]/.test(value) },
  { label: "Symbol", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export default function SignUp() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({ resolver: zodResolver(schema), defaultValues: { password: "" } });

  const password = watch("password") || "";

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/app", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const submitHandler = async (data) => {
    setIsSubmitting(true);
    try {
      await signUp(data);
      toast.success("Account created. Sign in to continue.");
      reset();
      navigate("/login");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Sign up failed. Please try again",
      );
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
            Create your workspace
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Generate your first article, rewrite, or image in under a minute.
          </p>
        </div>

        <div className="border border-white/[0.08] bg-[#0a0a0a] p-7 sm:p-9">
          <form onSubmit={handleSubmit(submitHandler)} className="space-y-6" noValidate>
            <div>
              <label htmlFor="name" className={LABEL}>
                Name
              </label>
              <input
                id="name"
                autoComplete="name"
                {...register("name")}
                placeholder="Your name"
                aria-invalid={Boolean(errors?.name)}
                aria-describedby={errors?.name ? "name-error" : undefined}
                className={`${INPUT} ${errors?.name ? INPUT_ERROR : ""}`}
              />
              <FieldError id="name-error">{errors?.name?.message}</FieldError>
            </div>

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
                  autoComplete="new-password"
                  {...register("password")}
                  placeholder="••••••••"
                  aria-invalid={Boolean(errors?.password)}
                  aria-describedby="password-rules"
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

              <ul
                id="password-rules"
                className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5"
              >
                {RULES.map((rule) => {
                  const met = rule.test(password);
                  return (
                    <li
                      key={rule.label}
                      className={`font-mono text-[0.625rem] tracking-[0.14em] uppercase transition-colors ${
                        met ? "text-[#ff9933]" : "text-white/30"
                      }`}
                    >
                      <span aria-hidden="true">{met ? "✓" : "·"}</span> {rule.label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <Btn type="submit" disabled={isSubmitting} className="w-full !py-3.5">
              {isSubmitting ? (
                <>
                  <LoadingIcon style="animate-spin h-4 w-4" />
                  <span>Creating…</span>
                </>
              ) : (
                "Create account"
              )}
            </Btn>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-white/45">
          Already have an account?{" "}
          <Link to="/login" className="nav-link text-white hover:text-[#ff9933]">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
