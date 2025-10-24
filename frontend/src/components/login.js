/**
 * LoginPage
 * Handles Supabase email/password and Google OAuth authentication.
 * Redirects authenticated users to previous page or root.
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

import intuneLogoImage from "../assets/logo/INTUNE.LOGO.png";

const VALIDATION_RULES = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address",
  },
  password: {
    required: true,
    minLength: 6,
    message: "Password must be at least 6 characters long",
  },
};

const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  isLoading,
  validationErrors,
}) => (
  <form onSubmit={onSubmit} className="auth-form" noValidate>
    <div className="input-group">
      <label htmlFor="email" className="input-label">
        Email Address
      </label>
      <input
        id="email"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={`auth-input ${validationErrors.email ? "error" : ""}`}
        required
        autoComplete="email"
        disabled={isLoading}
        aria-describedby={validationErrors.email ? "email-error" : undefined}
      />
      {validationErrors.email && (
        <span id="email-error" className="error-message" role="alert">
          {validationErrors.email}
        </span>
      )}
    </div>

    <div className="input-group">
      <label htmlFor="password" className="input-label">
        Password
      </label>
      <input
        id="password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={`auth-input ${validationErrors.password ? "error" : ""}`}
        required
        autoComplete="current-password"
        disabled={isLoading}
        aria-describedby={
          validationErrors.password ? "password-error" : undefined
        }
      />
      {validationErrors.password && (
        <span id="password-error" className="error-message" role="alert">
          {validationErrors.password}
        </span>
      )}
    </div>

    <button
      type="submit"
      className="auth-submit-button"
      disabled={isLoading}
      aria-label="Sign in to your account"
    >
      {isLoading ? (
        <>
          <span className="button-spinner" />
          Signing In...
        </>
      ) : (
        "Sign In"
      )}
    </button>
  </form>
);

const GoogleOAuthButton = ({ onClick, isLoading }) => (
  <button
    onClick={onClick}
    className="oauth-button google-oauth"
    disabled={isLoading}
    type="button"
    aria-label="Sign in with Google"
  >
    <span className="oauth-icon">🔐</span>
    {isLoading ? "Connecting..." : "Continue with Google"}
  </button>
);

const AuthenticationError = ({ error, onDismiss }) => {
  if (!error) return null;
  return (
    <div className="auth-error" role="alert" aria-live="polite">
      <span className="error-icon">⚠️</span>
      <span className="error-text">{error}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="error-dismiss"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
};

const LoadingSpinner = ({ message }) => (
  <div className="auth-loading" role="status" aria-label="Loading login page">
    <div className="loading-spinner" />
    <p className="loading-text">{message}</p>
  </div>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const redirectPath = state?.from || "/";

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [validationErrors, setValidationErrors] = useState({});
  const [authenticationError, setAuthenticationError] = useState("");
  const [isLoading, setIsLoading] = useState(true); // initial session check
  const [isSubmitting, setIsSubmitting] = useState(false); // form/OAuth in-flight

  // Initial session check
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (session?.user) {
          navigate(redirectPath, { replace: true });
        } else {
          setIsLoading(false);
        }
      } catch {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [navigate, redirectPath]);

  // Listen for OAuth redirects / auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        navigate(redirectPath, { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, redirectPath]);

  const validateForm = () => {
    const errors = {};
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!VALIDATION_RULES.email.pattern.test(formData.email)) {
      errors.email = VALIDATION_RULES.email.message;
    }
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < VALIDATION_RULES.password.minLength) {
      errors.password = VALIDATION_RULES.password.message;
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailPasswordLogin = async (event) => {
    event.preventDefault();
    setAuthenticationError("");
    setValidationErrors({});
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw new Error(error.message);
      // Success handled by auth state change listener
    } catch (err) {
      setAuthenticationError(
        err?.message ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleOAuth = async () => {
    setAuthenticationError("");
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}${redirectPath}` },
      });
      if (error) throw new Error(error.message);
      // Redirect occurs; no further action needed here
    } catch (err) {
      setAuthenticationError(
        err?.message || "Google login failed. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading..." />;

  return (
    <div className="auth-page">
      <div className="auth-container">
        <header className="auth-brand-header">
          <div className="auth-logo-wrapper">
            <img
              src={intuneLogoImage}
              className="auth-logo"
              alt="Intune - Music Discovery Platform"
            />
          </div>
        </header>

        <main className="auth-content">
          <div className="auth-card">
            <div className="auth-header">
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">
                Sign in to discover and save your favorite music
              </p>
            </div>

            <LoginForm
              email={formData.email}
              setEmail={(v) => updateFormData("email", v)}
              password={formData.password}
              setPassword={(v) => updateFormData("password", v)}
              onSubmit={handleEmailPasswordLogin}
              isLoading={isSubmitting}
              validationErrors={validationErrors}
            />

            <div className="auth-divider">
              <span className="divider-text">or</span>
            </div>

            <GoogleOAuthButton
              onClick={handleGoogleOAuth}
              isLoading={isSubmitting}
            />

            <AuthenticationError
              error={authenticationError}
              onDismiss={() => setAuthenticationError("")}
            />
          </div>
        </main>

        <footer className="auth-footer">
          <p className="auth-footer-text">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="auth-link">
              Create one here
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
