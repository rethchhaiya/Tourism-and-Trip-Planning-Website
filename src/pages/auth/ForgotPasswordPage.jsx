import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowBigRight, Mail, Radio, Search } from "lucide-react";
import {
  forgotPassword,
  OTP_VERIFICATION_PATH,
  setPendingOtpEmail,
} from "../../services/authService";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const FORGOT_PASSWORD_SUCCESS_MESSAGE =
  "If an account with that email exists, a verification code has been sent.";

const CHANNELS = [
  { value: "email", label: "Email" },
  { value: "telegram", label: "Telegram" },
];

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

  if (!values.channel) {
    errors.channel = "Choose a delivery channel.";
  }

  return errors;
}

function mapServerErrors(error) {
  const fieldErrors = {};

  if (!error?.errors || typeof error.errors !== "object") {
    return fieldErrors;
  }

  for (const [field, messages] of Object.entries(error.errors)) {
    if (field !== "email" && field !== "channel") {
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

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: "", channel: "email" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  function handleChange(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) =>
      prev[field] ? { ...prev, [field]: undefined } : prev,
    );
    setFormError("");
    setIsSuccess(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError("");
    setIsSuccess(false);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword({
        email: values.email.trim(),
        channel: values.channel,
      });
      setIsSuccess(true);
    } catch (error) {
      const fieldErrors = mapServerErrors(error);
      const onlyEmailErrors =
        Object.keys(fieldErrors).length > 0 &&
        Object.keys(fieldErrors).every((field) => field === "email");

      if (error?.status === 404 || onlyEmailErrors) {
        setIsSuccess(true);
        return;
      }

      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return;
      }

      setFormError(
        error?.message || "Unable to send a verification code. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleContinue() {
    setPendingOtpEmail(values.email.trim());
    navigate(OTP_VERIFICATION_PATH, {
      state: {
        email: values.email.trim(),
        channel: values.channel,
        fromForgotPassword: true,
      },
    });
  }

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

        <h2 className="text-xl font-bold text-gray-900">Forgot password?</h2>
        <p className="mb-6 mt-1 text-sm text-gray-500">
          Enter your email and choose where to receive the verification code.
        </p>

        {isSuccess ? (
          <div className="space-y-4">
            <p
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
            >
              {FORGOT_PASSWORD_SUCCESS_MESSAGE}
            </p>
            <button
              type="button"
              onClick={handleContinue}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:bg-indigo-800"
            >
              Enter verification code
              <ArrowBigRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            {formError && (
              <p
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600"
              >
                {formError}
              </p>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={values.email}
                    onChange={(event) =>
                      handleChange("email", event.target.value)
                    }
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                      errors.email ? "forgot-email-error" : undefined
                    }
                    className={inputClassName(
                      Boolean(errors.email),
                      "pl-10 pr-3",
                    )}
                  />
                </div>
                {errors.email && (
                  <p
                    id="forgot-email-error"
                    className="mt-1 text-sm text-red-500"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="forgot-channel"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700"
                >
                  Delivery Channel
                </label>
                <div className="relative">
                  <Radio className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <select
                    id="forgot-channel"
                    name="channel"
                    value={values.channel}
                    onChange={(event) =>
                      handleChange("channel", event.target.value)
                    }
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.channel)}
                    aria-describedby={
                      errors.channel ? "forgot-channel-error" : undefined
                    }
                    className={inputClassName(
                      Boolean(errors.channel),
                      "pl-10 pr-3",
                    )}
                  >
                    {CHANNELS.map((channel) => (
                      <option key={channel.value} value={channel.value}>
                        {channel.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.channel && (
                  <p
                    id="forgot-channel-error"
                    className="mt-1 text-sm text-red-500"
                  >
                    {errors.channel}
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
                    Sending...
                  </>
                ) : (
                  <>
                    Send verification code
                    <ArrowBigRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
