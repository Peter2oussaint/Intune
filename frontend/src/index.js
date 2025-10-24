
/**
 * Main entry point for the Intune music discovery application
 * Sets up React Router with public and protected routes
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Components
 import IntuneApp from "./components/IntuneApp";
import SignupPage from "./components/signup";
import LoginPage from "./components/login";
import PrivateRoute from "./components/privateRoute";

// Application Routes Configuration
const AppRoutes = () => (
  <Routes>
    {/* Public Routes - No authentication required */}
    <Route 
      path="/signup" 
      element={<SignupPage />} 
      aria-label="User registration page"
    />
    <Route 
      path="/login" 
      element={<LoginPage />} 
      aria-label="User login page"
    />
    
    {/* Protected Routes - Authentication required */}
    <Route
      path="/"
      element={
        <PrivateRoute>
          <IntuneApp />
        </PrivateRoute>
      }
      aria-label="Main application"
    />
  </Routes>
);

// Initialize React Application
const initializeApp = () => {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    throw new Error("Root element not found. Make sure index.html has a div with id='root'");
  }

  const root = createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </React.StrictMode>
  );
};

// Start the application
initializeApp();