import { useState } from "react";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CompassIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
} from "../../components/common/Icons";
import {
  forgetRememberedEmail,
  getRememberedEmail,
  rememberEmail,
} from "../../services/authService";
import { useAuth } from "../../context/useAuth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFields({ email, password }) {
  const errors = {};
  if (!email.trim()) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!password) {
    errors.password = "Password is required.";
  }
  return errors;
}

function inputClassName(hasError, paddingClass) {
  const base =
    "h-9 w-full rounded-md border bg-white text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition duration-150 disabled:cursor-not-allowed disabled:opacity-60";
  const state = hasError
    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
    : "border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";
  return `${base} ${paddingClass} ${state}`;
}

export default function LoginPage({ onSuccess }) {
  const { login } = useAuth();
  const rememberedEmail = getRememberedEmail();
  const [values, setValues] = useState({
    email: rememberedEmail,
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState("");
  const [notice, setNotice] = useState("");
  const [remember, setRemember] = useState(Boolean(rememberedEmail));
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    setAuthError("");
    setNotice("");
  }

  function handleForgotPassword() {
    setAuthError("");
    setNotice(
      "Password reset is not configured yet. Contact the system administrator.",
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateFields(values);
    setErrors(nextErrors);
    setAuthError("");
    setNotice("");
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await login({
        email: values.email.trim(),
        password: values.password,
      });
      if (remember) {
        rememberEmail(values.email.trim());
      } else {
        forgetRememberedEmail();
      }
      onSuccess?.(session);
    } catch (error) {
      setAuthError(error.message || "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f8ff]">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="mx-auto w-full max-w-87.5">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <header className="border-b border-slate-200 pb-3 text-center">
              <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                <CompassIcon className="h-5 w-5" />
              </span>
              <h1 className="text-base font-bold text-slate-900">
                TravelAdmin
              </h1>
              <p className="text-xs text-slate-500">Management System</p>
            </header>

            <form className="pt-3" onSubmit={handleSubmit} noValidate>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Admin Login
                </h2>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                  Enter your credentials to access the dashboard.
                </p>
              </div>

              {authError && (
                <p
                  role="alert"
                  className="mt-2.5 flex items-start gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-medium leading-relaxed text-red-600"
                >
                  <AlertCircleIcon className="mt-px h-3.5 w-3.5 shrink-0" />
                  <span>{authError}</span>
                </p>
              )}

              {notice && !authError && (
                <p
                  role="status"
                  className="mt-2.5 rounded-md border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-medium leading-relaxed text-indigo-600"
                >
                  {notice}
                </p>
              )}

              <div className="mt-2.5">
                <label
                  htmlFor="login-email"
                  className="text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                >
                  Email Address
                </label>
                <div className="relative mt-1">
                  <MailIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@traveladmin.com"
                    value={values.email}
                    onChange={(event) =>
                      handleChange("email", event.target.value)
                    }
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                      errors.email ? "login-email-error" : undefined
                    }
                    className={inputClassName(
                      Boolean(errors.email),
                      "pl-10 pr-3",
                    )}
                  />
                </div>
                {errors.email && (
                  <p
                    id="login-email-error"
                    className="mt-1 text-[10px] font-medium text-red-500"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="mt-2.5">
                <label
                  htmlFor="login-password"
                  className="text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                >
                  Password
                </label>
                <div className="relative mt-1">
                  <LockIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={values.password}
                    onChange={(event) =>
                      handleChange("password", event.target.value)
                    }
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? "login-password-error" : undefined
                    }
                    className={inputClassName(
                      Boolean(errors.password),
                      "pl-10 pr-10",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition duration-150 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-3.5 w-3.5" />
                    ) : (
                      <EyeIcon className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p
                    id="login-password-error"
                    className="mt-1 text-[10px] font-medium text-red-500"
                  >
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="mt-2.5 flex items-center justify-between">
                <label className="flex cursor-pointer select-none items-center gap-1.5 text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-3.5 w-3.5 accent-indigo-600"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] font-medium text-indigo-600 transition duration-150 hover:text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-indigo-600 text-[13px] font-semibold text-white transition duration-150 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span
                      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                      aria-hidden="true"
                    />
                    Logging in...
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-[11px] text-indigo-600">
                Create an account?{' '}
                {/* <span className="font-medium text-indigo-600 hover:text-indigo-700">Register</span> */}
              </p>
            </form>
          </section>

          <p className="mt-4 text-center text-[11px] text-slate-400">
            © 2024 TravelAdmin. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
