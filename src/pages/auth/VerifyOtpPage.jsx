import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowBigRight,
  KeyRound,
  Mail,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  getPendingOtpEmail,
  RESET_PASSWORD_PATH,
  resendOtp,
  verifyOtp,
} from "../../services/authService";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const OTP_RESEND_COOLDOWN_SECONDS = 60;

function firstMessage(messages) {
  if (Array.isArray(messages)) {
    return messages[0];
  }
  return typeof messages === "string" ? messages : "";
}

function validate(values) {
  const errors = {};

  if (!values.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.otp.trim()) {
    errors.otp = "Verification code is required.";
  }

  return errors;
}

function mapServerErrors(error) {
  const fieldErrors = {};

  if (!error?.errors || typeof error.errors !== "object") {
    return fieldErrors;
  }

  for (const [field, messages] of Object.entries(error.errors)) {
    if (field !== "email" && field !== "otp") {
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
    "h-10 w-full rounded-lg border bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none transition disabled:cursor-not-allowed disabled:opacity-60";
  const state = hasError
    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
    : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";
  return `${base} ${paddingClass} ${state}`;
}

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isForgotFlow = Boolean(location.state?.fromForgotPassword);
  const [values, setValues] = useState({
    email: location.state?.email ?? getPendingOtpEmail() ?? "",
    otp: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  function handleChange(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) =>
      prev[field] ? { ...prev, [field]: undefined } : prev,
    );
    setFormError("");
    setNotice("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError("");
    setNotice("");
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      // In the forgot-password flow the OTP is consumed by
      // /auth/reset-password-with-otp, so it must NOT be verified here.
      if (isForgotFlow) {
        navigate(RESET_PASSWORD_PATH, {
          replace: true,
          state: {
            email: values.email.trim(),
            otp: values.otp.trim(),
          },
        });
        return;
      }

      await verifyOtp({
        email: values.email.trim(),
        otp: values.otp.trim(),
      });
      navigate("/login", { replace: true });
    } catch (error) {
      const fieldErrors = mapServerErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setFormError(
          error?.message || "Unable to verify the code. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setFormError("");
    setNotice("");

    if (!EMAIL_PATTERN.test(values.email.trim())) {
      setErrors((prev) => ({
        ...prev,
        email: "Enter a valid email address.",
      }));
      return;
    }

    setIsResending(true);
    try {
      await resendOtp({ email: values.email.trim() });
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      setNotice("A new verification code has been sent.");
    } catch (error) {
      setFormError(
        error?.message || "Unable to resend the code. Please try again.",
      );
    } finally {
      setIsResending(false);
    }
  }

  const resendLabel = cooldown > 0
    ? `Resend in ${cooldown}s`
    : isResending
      ? "Sending..."
      : "Resend code";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-sm">
            <Search className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            TravelAdmin
          </h1>
          <p className="mt-1 text-sm text-gray-500">Management System</p>
        </div>

        <h2 className="text-xl font-bold text-gray-900">Verify your email</h2>
        <p className="mb-6 mt-1 text-sm text-gray-500">
          Enter the verification code we sent to your email.
        </p>

        {formError && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600"
          >
            {formError}
          </p>
        )}

        {notice && !formError && (
          <p
            role="status"
            className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
          >
            {notice}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="otp-email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="otp-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={values.email}
                onChange={(event) => handleChange("email", event.target.value)}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "otp-email-error" : undefined}
                className={inputClassName(Boolean(errors.email), "pl-10 pr-3")}
              />
            </div>
            {errors.email && (
              <p id="otp-email-error" className="mt-1 text-sm text-red-500">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="otp-code"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700"
            >
              Verification Code
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="otp-code"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter your code"
                value={values.otp}
                onChange={(event) => handleChange("otp", event.target.value)}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.otp)}
                aria-describedby={errors.otp ? "otp-code-error" : undefined}
                className={inputClassName(Boolean(errors.otp), "pl-10 pr-3")}
              />
            </div>
            {errors.otp && (
              <p id="otp-code-error" className="mt-1 text-sm text-red-500">
                {errors.otp}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
                {isForgotFlow ? "Loading..." : "Verifying..."}
              </>
            ) : (
              <>
                {isForgotFlow ? "Continue" : "Verify code"}
                <ArrowBigRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
          <span>Didn't receive a code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className="inline-flex items-center gap-1.5 font-medium text-indigo-600 transition hover:text-indigo-700 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {resendLabel}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
