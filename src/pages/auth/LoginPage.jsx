import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  getGoogleRedirectUrl,
  getRememberedEmail,
  rememberEmail,
} from "../../services/authService";
import { useAuth } from "../../context/useAuth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CREDENTIALS_ERROR = "Invalid email or password.";

function GoogleLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

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

function firstMessage(messages) {
  if (Array.isArray(messages)) {
    return messages[0];
  }
  return typeof messages === "string" ? messages : "";
}

function mapServerErrors(error) {
  const fieldErrors = {};

  if (!error?.errors || typeof error.errors !== "object") {
    return fieldErrors;
  }

  for (const [field, messages] of Object.entries(error.errors)) {
    if (field !== "email" && field !== "password") {
      continue;
    }
    const message = firstMessage(messages);
    if (message) {
      fieldErrors[field] = message;
    }
  }

  return fieldErrors;
}

function inputClassName(hasError, paddingClass) {
  const base =
    "h-10 w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition duration-150 disabled:cursor-not-allowed disabled:opacity-60";
  const state = hasError
    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
    : "border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";
  return `${base} ${paddingClass} ${state}`;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from ?? "/";
  const googleRedirectUrl = getGoogleRedirectUrl();
  const rememberedEmail = getRememberedEmail();
  const [values, setValues] = useState({
    email: rememberedEmail,
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState("");
  const [remember, setRemember] = useState(Boolean(rememberedEmail));
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    setAuthError("");
  }

  function handleForgotPassword() {
    setAuthError("");
    navigate("/forgot-password");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateFields(values);
    setErrors(nextErrors);
    setAuthError("");
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email: values.email.trim(),
        password: values.password,
      });
      if (remember) {
        rememberEmail(values.email.trim());
      } else {
        forgetRememberedEmail();
      }
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        setAuthError(CREDENTIALS_ERROR);
        return;
      }

      const fieldErrors = mapServerErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return;
      }

      setAuthError(error?.message || "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f8ff]">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="mx-auto w-full max-w-md">
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <header className="border-b border-slate-200 pb-6 text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                <CompassIcon className="h-7 w-7" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                TravelAdmin
              </h1>
              <p className="mt-1 text-sm text-slate-500">Management System</p>
            </header>

            <form className="pt-6" onSubmit={handleSubmit} noValidate>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Admin Login
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  Enter your credentials to access the dashboard.
                </p>
              </div>

              {authError && (
                <p
                  role="alert"
                  className="mt-3 flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium leading-relaxed text-red-600"
                >
                  <AlertCircleIcon className="mt-px h-4 w-4 shrink-0" />
                  <span>{authError}</span>
                </p>
              )}

              <div className="mt-5">
                <label
                  htmlFor="login-email"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Email Address
                </label>
                <div className="relative mt-1.5">
                  <MailIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                    className="mt-1 text-sm font-medium text-red-500"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="mt-5">
                <label
                  htmlFor="login-password"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Password
                </label>
                <div className="relative mt-1.5">
                  <LockIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p
                    id="login-password-error"
                    className="mt-1 text-sm font-medium text-red-500"
                  >
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-medium text-indigo-600 transition duration-150 hover:text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition duration-150 hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                      aria-hidden="true"
                    />
                    Logging in...
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRightIcon className="h-4 w-4" />
                  </>
                )}
              </button>

              {googleRedirectUrl && (
                <>
                  <div className="mt-6 flex items-center gap-3">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      or
                    </span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                  <a
                    href={googleRedirectUrl}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 shadow-sm transition duration-150 hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                  >
                    <GoogleLogo className="h-5 w-5" />
                    Continue with Google
                  </a>
                </>
              )}

              <p className="mt-6 text-center text-sm text-indigo-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Register
                </Link>
              </p>
            </form>
          </section>

          <p className="mt-6 text-center text-xs text-slate-400">
            © 2024 TravelAdmin. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
