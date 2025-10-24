import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

const AuthenticationLoader = () => (
  <div
    className="auth-loader"
    role="status"
    aria-label="Checking authentication"
  >
    <div className="spinner"></div>
    <p>Verifying your login...</p>
  </div>
);

const PrivateRoute = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;
        if (isMounted) setCurrentUser(session?.user ?? null);
      } catch (err) {
        if (isMounted) setAuthError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setCurrentUser(session?.user ?? null);
        setLoading(false);
        setAuthError(null);
      }
    });

    initAuth();
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return <AuthenticationLoader />;
  if (authError)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (currentUser) return children;

  return <Navigate to="/login" state={{ from: location.pathname }} replace />;
};

export default PrivateRoute;
