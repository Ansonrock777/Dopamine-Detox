"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEffect } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "signin" | "signup";
  onModeChange: (mode: "signin" | "signup") => void;
}

const clerkAppearance = {
  elements: {
    formButtonPrimary:
      "bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-none",
    card: "bg-transparent shadow-none border-0",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
    socialButtonsBlockButtonText: "text-white",
    dividerLine: "bg-gray-700",
    dividerText: "text-gray-400",
    formFieldInput: "bg-gray-800 border-gray-700 text-white",
    formFieldLabel: "text-gray-300",
    footerActionText: "text-gray-400",
    footerActionLink: "text-blue-400 hover:text-blue-300",
    identityPreviewText: "text-gray-300",
    identityPreviewEditButton: "text-blue-400 hover:text-blue-300",
  },
};

export function AuthModal({
  isOpen,
  onClose,
  mode,
  onModeChange,
}: AuthModalProps) {
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === "#signup" && mode !== "signup") {
        onModeChange("signup");
      } else if (hash === "#signin" && mode !== "signin") {
        onModeChange("signin");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [mode, onModeChange]);

  const handleClerkNavigation = (e: React.MouseEvent) => {
    // Intercept Clerk's internal navigation
    const target = (e.target as Element)?.closest("a");
    if (target && target.href) {
      if (target.href.includes("#signup")) {
        e.preventDefault();
        onModeChange("signup");
      } else if (target.href.includes("#signin")) {
        e.preventDefault();
        onModeChange("signin");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md p-6">
        <DialogTitle className="sr-only">
          {mode === "signin" ? "Sign In" : "Sign Up"}
        </DialogTitle>
        <div className="space-y-6" onClick={handleClerkNavigation}>
          {mode === "signin" ? (
            <>
              <div className="flex justify-center">
                <SignIn
                  routing="hash"
                  afterSignInUrl="/dashboard"
                  appearance={clerkAppearance}
                  signUpUrl="#signup"
                  forceRedirectUrl="/dashboard"
                  redirectUrl="/dashboard"
                />
              </div>
              <div className="text-center text-gray-400 text-sm mt-4">
                If you don&apos;t have an account,{" "}
                <button
                  onClick={() => onModeChange("signup")}
                  className="text-blue-400 hover:text-blue-300 underline font-medium"
                >
                  sign up
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <SignUp
                  routing="hash"
                  afterSignUpUrl="/dashboard"
                  appearance={clerkAppearance}
                  signInUrl="#signin"
                  forceRedirectUrl="/dashboard"
                  redirectUrl="/dashboard"
                />
              </div>
              <div className="text-center text-gray-400 text-sm mt-4">
                If you already have an account,{" "}
                <button
                  onClick={() => onModeChange("signin")}
                  className="text-blue-400 hover:text-blue-300 underline font-medium"
                >
                  sign in
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
