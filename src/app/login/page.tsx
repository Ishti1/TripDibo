"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Plane, ArrowUpRight, Mail, Lock, User, Globe2, MapPin, Compass } from "lucide-react";

/* ── Inline SVG icons for Google & Facebook (to avoid extra deps) ── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        // Register first, then sign in
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Registration failed.");
          setLoading(false);
          return;
        }
      }

      // Sign in with credentials
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          isSignUp
            ? "Account created but sign-in failed. Please try signing in."
            : "Invalid email or password."
        );
        if (isSignUp) setIsSignUp(false);
        setLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    setOauthLoading(provider);
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="login-page">
      {/* Left decorative panel */}
      <div className="login-hero">
        <div className="login-hero-bg" />
        <div className="login-hero-content">
          <div className="login-brand">
            <span className="brand-mark"><Plane size={23} /></span>
            tripdibo<span className="brand-dot">.</span>
          </div>

          <div className="login-hero-copy">
            <span className="login-kicker">
              <span />YOUR ADVENTURE AWAITS
            </span>
            <h1>Go somewhere<br /><em>you&apos;ll never forget.</em></h1>
            <p>Plan trips, organize itineraries, track budgets,<br />and make room for memories.</p>
          </div>

          <div className="login-features">
            {[
              { icon: MapPin, text: "Plan trips to any destination" },
              { icon: Compass, text: "AI-powered travel assistant" },
              { icon: Globe2, text: "Sync across all your devices" },
            ].map((f) => (
              <div key={f.text} className="login-feature">
                <f.icon size={16} />
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          <div className="login-stamp">
            <Compass size={28} />
            <span>GO. WANDER.<br />COME BACK<br />INSPIRED.</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <span className="eyebrow">
              {isSignUp ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}
            </span>
            <h2>{isSignUp ? "Start your journey" : "Sign in to your space"}</h2>
            <p>
              {isSignUp
                ? "Create an account and bring your travel plans to life."
                : "Your trips, ideas, and plans are waiting for you."}
            </p>
          </div>

          {/* ── OAuth providers ── */}
          <div className="oauth-buttons">
            <button
              className="oauth-button"
              onClick={() => handleOAuth("google")}
              disabled={!!oauthLoading}
              type="button"
            >
              {oauthLoading === "google" ? (
                <span className="spinner" />
              ) : (
                <>
                  <GoogleIcon />
                  Continue with Google
                </>
              )}
            </button>
            <button
              className="oauth-button"
              onClick={() => handleOAuth("facebook")}
              disabled={!!oauthLoading}
              type="button"
            >
              {oauthLoading === "facebook" ? (
                <span className="spinner" />
              ) : (
                <>
                  <FacebookIcon />
                  Continue with Facebook
                </>
              )}
            </button>
          </div>

          <div className="login-divider">
            <span>or continue with email</span>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {/* ── Email/Password form ── */}
          <form onSubmit={handleEmailAuth} className="form-stack">
            {isSignUp && (
              <label>
                <span className="login-label"><User size={14} /> Full name</span>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </label>
            )}

            <label>
              <span className="login-label"><Mail size={14} /> Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>

            <label>
              <span className="login-label"><Lock size={14} /> Password</span>
              <input
                type="password"
                placeholder={isSignUp ? "Min 6 characters" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSignUp ? 6 : undefined}
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </label>

            <button
              type="submit"
              className="button primary login-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                <>
                  {isSignUp ? "Create account" : "Sign in"}
                  <ArrowUpRight size={16} />
                </>
              )}
            </button>
          </form>

          <button
            className="login-switch"
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            type="button"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
            <ArrowUpRight size={14} />
          </button>

          <p className="login-footnote">
            By continuing, you agree to our terms. Your trip data is stored securely in the cloud.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
