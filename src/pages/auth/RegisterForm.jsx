import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowBigRight,
  Lock,
  Mail,
  Phone,
  Search,
  User,
  Radio,
} from "lucide-react";
import {
  OTP_VERIFICATION_PATH,
  register as registerAccount,
  setPendingOtpEmail,
} from "../../services/authService";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_VALUES = {
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
  channel: "",
  phone: "",
};

const SERVER_FIELD_MAP = {
  name: "name",
  email: "email",
  password: "password",
  password_hash: "password",
  password_confirmation: "password_confirmation",
  password_hash_confirmation: "password_confirmation",
  channel: "channel",
  phone: "phone",
};

function firstMessage(messages) {
  if (Array.isArray(messages)) {
    return messages[0];
  }
  return typeof messages === "string" ? messages : "";
}

function validate(values) {
  const errors = {};

  if (!values.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!values.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  }

  if (!values.password_confirmation) {
    errors.password_confirmation = "Please confirm your password.";
  } else if (values.password !== values.password_confirmation) {
    errors.password_confirmation = "Passwords do not match.";
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

export const RegisterForm = () => {
  const navigate = useNavigate();
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) =>
      prev[field] ? { ...prev, [field]: undefined } : prev,
    );
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await registerAccount(values);
      setPendingOtpEmail(values.email.trim());
      navigate(OTP_VERIFICATION_PATH, {
        replace: true,
        state: {
          email: values.email.trim(),
          channel: values.channel.trim() || null,
        },
      });
    } catch (error) {
      const fieldErrors = mapServerErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setFormError(
          error?.message || "Unable to create your account. Please try again.",
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

        <h2 className="text-xl font-bold text-gray-900">Create Account</h2>
        <p className="mb-6 mt-1 text-sm text-gray-500">
          Enter your information to create an account.
        </p>

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
              htmlFor="register-name"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700"
            >
              Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="register-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={values.name}
                onChange={(event) => handleChange("name", event.target.value)}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "register-name-error" : undefined}
                className={inputClassName(Boolean(errors.name), "pl-10 pr-3")}
              />
            </div>
            {errors.name && (
              <p id="register-name-error" className="mt-1 text-sm text-red-500">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={values.email}
                onChange={(event) => handleChange("email", event.target.value)}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email ? "register-email-error" : undefined
                }
                className={inputClassName(Boolean(errors.email), "pl-10 pr-3")}
              />
            </div>
            {errors.email && (
              <p id="register-email-error" className="mt-1 text-sm text-red-500">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={values.password}
                onChange={(event) =>
                  handleChange("password", event.target.value)
                }
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "register-password-error" : undefined
                }
                className={inputClassName(
                  Boolean(errors.password),
                  "pl-10 pr-3",
                )}
              />
            </div>
            {errors.password && (
              <p
                id="register-password-error"
                className="mt-1 text-sm text-red-500"
              >
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="register-password-confirmation"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="register-password-confirmation"
                name="password_confirmation"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={values.password_confirmation}
                onChange={(event) =>
                  handleChange("password_confirmation", event.target.value)
                }
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.password_confirmation)}
                aria-describedby={
                  errors.password_confirmation
                    ? "register-password-confirmation-error"
                    : undefined
                }
                className={inputClassName(
                  Boolean(errors.password_confirmation),
                  "pl-10 pr-3",
                )}
              />
            </div>
            {errors.password_confirmation && (
              <p
                id="register-password-confirmation-error"
                className="mt-1 text-sm text-red-500"
              >
                {errors.password_confirmation}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="register-channel"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700"
              >
                Channel (optional)
              </label>
              <div className="relative">
                <Radio className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="register-channel"
                  name="channel"
                  type="text"
                  placeholder="Email, SMS..."
                  value={values.channel}
                  onChange={(event) =>
                    handleChange("channel", event.target.value)
                  }
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.channel)}
                  aria-describedby={
                    errors.channel ? "register-channel-error" : undefined
                  }
                  className={inputClassName(Boolean(errors.channel), "pl-10 pr-3")}
                />
              </div>
              {errors.channel && (
                <p
                  id="register-channel-error"
                  className="mt-1 text-sm text-red-500"
                >
                  {errors.channel}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="register-phone"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-700"
              >
                Phone (optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="register-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+855 12 345 678"
                  value={values.phone}
                  onChange={(event) =>
                    handleChange("phone", event.target.value)
                  }
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={
                    errors.phone ? "register-phone-error" : undefined
                  }
                  className={inputClassName(Boolean(errors.phone), "pl-10 pr-3")}
                />
              </div>
              {errors.phone && (
                <p id="register-phone-error" className="mt-1 text-sm text-red-500">
                  {errors.phone}
                </p>
              )}
            </div>
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
                Creating account...
              </>
            ) : (
              <>
                Register
                <ArrowBigRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            Login
          </Link>
        </p>

        <p className="mt-3 text-xs text-gray-400">
          © 2024 TravelAdmin. All rights reserved.
        </p>
      </div>
    </div>
  );
};
