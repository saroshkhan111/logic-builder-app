"use client";

import { SignInButton } from "@/components/auth/SignInButton";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">Welcome to Logic Builder</h1>
          <p className="text-sm text-slate-400">
            Sign in to save your projects and progress
          </p>
        </div>
        <SignInButton />
      </div>
    </div>
  );
}
