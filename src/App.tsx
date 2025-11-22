"use client";

import {
  Authenticated,
  Unauthenticated,
} from "convex/react";
import { useState } from "react";
import { LoginForm } from "./components/login-form";
import { SignupForm } from "./components/signup-form";
import { Dashboard } from "./components/Dashboard";
import { CallSettingsProvider } from "./contexts/CallSettingsContext";

export default function App() {
  return (
    <CallSettingsProvider>
      <Authenticated>
        <Dashboard />
      </Authenticated>
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
          <div className="w-full max-w-md">
            <AuthFlow />
          </div>
        </div>
      </Unauthenticated>
    </CallSettingsProvider>
  );
}

function AuthFlow() {
  const [view, setView] = useState<"login" | "adminSignup">("login");
  
  if (view === "adminSignup") {
    return (
      <div className="space-y-4">
        <SignupForm onBackToLogin={() => setView("login")} />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <LoginForm onAdminSignup={() => setView("adminSignup")} />
    </div>
  );
}
