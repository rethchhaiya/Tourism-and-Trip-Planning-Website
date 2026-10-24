import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowBigRight, KeyRound, Lock, Search } from "lucide-react";
import {
  clearPendingOtpEmail,
  getSession,
  resetPassword,
} from "../../services/authService";

const SERVER_FIELD_MAP = {
  old_password: "old_password",
  current_password: "old_password",
  new_password: "new_password",
  password: "new_password",
  password_hash: "new_password",
  new_password_confirmation: "new_password_confirmation",
  password_confirmation: "new_password_confirmation",
  password_hash_confirmation: "new_password_confirmation",
};

function firstMessage(messages) {
  if (Array.isArray(messages)) {
    return messages[0];
  }
  return typeof messages === "string" ? messages : "";
}

function validate(values, requiresOldPassword) {
  const errors = {};

  if (requiresOldPassword && !values.old_password) {
    errors.old_password = "Old password is required.";
  }

  if (!values.new_password) {
    errors.new_password = "New password is required.";
  }

  if (!values.new_password_confirmation) {
    errors.new_password_confirmation = "Please confirm your new password.";
  } else if (values.new_password !== values.new_password_confirmation) {
    errors.new_password_confirmation = "Passwords do not match.";
  }

  return errors;
}

function mapServerErrors(error) {
  const fieldErrors = {};

  if (!error?.errors || typeof error.errors !== "object") {
    return fieldErrors;
  }

  for (const [field, messages] of Object.entries(error.errors)) {
    const key = SERVER_FIELD_MAP[field];
    const message = firstMessage(messages);
    if (key && message) {
      fieldErrors[key] = message;
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

export default function ResetPasswordPage() {
  const location = useLocation();
  const forgot = location.state?.email
    ? {
        email: location.state.email,
        otp: location.state.otp ?? "",
      }
    : null;
  const hasSession = Boolean(getSession()?.token);
  const isForgotFlow = Boolean(forgot);

  const [values, setValues] = useState({
    old_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
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
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values, !isForgotFlow);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(
        isForgotFlow
          ? {
              email: forgot.email,
              otp: forgot.otp,
              newPassword: values.new_password,
              newPasswordConfirmation: values.new_password_confirmation,
            }
          : {
              oldPassword: values.old_password,
              newPassword: values.new_password,
              newPasswordConfirmation: values.new_password_confirmation,
            },
      );
      clearPendingOtpEmail();
      setIsSuccess(true);
    } catch (error) {
      const fieldErrors = mapServerErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setFormError(
          error?.message || "Unable to reset your password. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
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

        <h2 className="text-xl font-bold text-gray-900">Reset password</h2>
        <p className="mb-6 mt-1 text-sm text-gray-500">
          {isForgotFlow
            ? "Your identity has been verified. Choose a new password."
            : "Enter your old password and choose a new one."}
        </p>

        {isSuccess ? (
          <div className="space-y-4">
            <p
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
            >
              Your password has been reset. You can now sign in.
            </p>
            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:bg-indigo-800"
            >
              Back to login
              <ArrowBigRight className="h-4 w-4" />
            </Link>
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

            {!isForgotFlow && !hasSession && (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                You need to sign in before you can change your password.{" "}
                <Link to="/login" className="font-medium underline">
                  Sign in
                </Link>
                .
              </p>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {!isForgotFlow && (
                <div>
                <label
                  htmlFor="reset-old-password"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700"
                >
                  Old Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="reset-old-password"
                    name="old_password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={values.old_password}
                    onChange={(event) =>
                      handleChange("old_password", event.target.value)
                    }
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.old_password)}
                    aria-describedby={
                      errors.old_password
                        ? "reset-old-password-error"
                        : undefined
                    }
                    className={inputClassName(
                      Boolean(errors.old_password),
                      "pl-10 pr-3",
                    )}
                  />
                </div>
                {errors.old_password && (
                  <p
                    id="reset-old-password-error"
                    className="mt-1 text-sm text-red-500"
                  >
                    {errors.old_password}
                  </p>
                )}
              </div>
              )}
              <div>
                <label
                  htmlFor="reset-new-password"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="reset-new-password"
                    name="new_password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={values.new_password}
                    onChange={(event) =>
                      handleChange("new_password", event.target.value)
                    }
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.new_password)}
                    aria-describedby={
                      errors.new_password
                        ? "reset-new-password-error"
                        : undefined
                    }
                    className={inputClassName(
                      Boolean(errors.new_password),
                      "pl-10 pr-3",
                    )}
                  />
                </div>
                {errors.new_password && (
                  <p
                    id="reset-new-password-error"
                    className="mt-1 text-sm text-red-500"
                  >
                    {errors.new_password}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reset-new-password-confirmation"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="reset-new-password-confirmation"
                    name="new_password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={values.new_password_confirmation}
                    onChange={(event) =>
                      handleChange(
                        "new_password_confirmation",
                        event.target.value,
                      )
                    }
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.new_password_confirmation)}
                    aria-describedby={
                      errors.new_password_confirmation
                        ? "reset-new-password-confirmation-error"
                        : undefined
                    }
                    className={inputClassName(
                      Boolean(errors.new_password_confirmation),
                      "pl-10 pr-3",
                    )}
                  />
                </div>
                {errors.new_password_confirmation && (
                  <p
                    id="reset-new-password-confirmation-error"
                    className="mt-1 text-sm text-red-500"
                  >
                    {errors.new_password_confirmation}
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
                    Resetting...
                  </>
                ) : (
                  <>
                    Reset password
                    <ArrowBigRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

          </>
        )}
      </div>
    </div>
  );
}
