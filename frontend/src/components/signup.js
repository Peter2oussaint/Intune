/**
 * Signup Component - User Registration Interface (Intune Styled)
 * Handles new user account creation with email/password authentication.
 * Provides form validation, error handling, and redirects to login after successful registration.
 */

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import intuneLogoImage from "/src/assets/logo/INTUNE.LOGO.png";

// Validation constants
const VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address",
  },
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
    message:
      "Password must include uppercase, lowercase, number, and special character",
  },
};

const PasswordStrengthIndicator = ({ password }) => {
  if (!password) return null;
  const checks = {
    length: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const levels = [
    { label: "", color: "#ccc" },
    { label: "Very Weak", color: "#ff4444" },
    { label: "Weak", color: "#ff8800" },
    { label: "Fair", color: "#ffaa00" },
    { label: "Good", color: "#88cc00" },
    { label: "Strong", color: "#00cc44" },
  ];
  const strength = levels[score];
  return (
    <div className="password-strength">
      <div className="strength-bar">
        <div
          className="strength-fill"
          style={{
            width: `${(score / 5) * 100}%`,
            backgroundColor: strength.color,
          }}
        />
      </div>
      <span className="strength-label" style={{ color: strength.color }}>
        {strength.label}
      </span>
    </div>
  );
};

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) navigate("/", { replace: true });
      } catch {
        // No-op in production; optional logger can be added here
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, [navigate]);

  const validate = () => {
    const errors = {};
    if (!VALIDATION_RULES.email.pattern.test(formData.email))
      errors.email = VALIDATION_RULES.email.message;
    if (formData.password.length < VALIDATION_RULES.password.minLength)
      errors.password = "Password must be at least 8 characters long";
    else if (!VALIDATION_RULES.password.pattern.test(formData.password))
      errors.password = VALIDATION_RULES.password.message;
    if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setRegistrationError("");
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { emailRedirectTo: `${window.location.origin}/login` },
      });
      if (error) throw error;
      setRegistrationSuccess(true);
    } catch (err) {
      setRegistrationError(
        err.message.includes("already registered")
          ? "An account with this email already exists."
          : "Registration failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingSession) return <p>Loading...</p>;

  if (registrationSuccess)
    return (
      <div className="auth-success">
        <img src={intuneLogoImage} className="auth-logo" alt="Intune" />
        <h2>Account Created!</h2>
        <p>Check your email to verify your account.</p>
        <button onClick={() => navigate("/login", { replace: true })}>
          Continue to Login
        </button>
      </div>
    );

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Create an Account</h1>
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        {validationErrors.email && <p className="error">{validationErrors.email}</p>}
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <PasswordStrengthIndicator password={formData.password} />
        {validationErrors.password && <p className="error">{validationErrors.password}</p>}
        <input
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        />
        {validationErrors.confirmPassword && <p className="error">{validationErrors.confirmPassword}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Account"}
        </button>
        {registrationError && <p className="error">{registrationError}</p>}
        <p>Already have an account? <Link to="/login">Sign In</Link></p>
      </form>
    </div>
  );
};

export default SignupPage;
