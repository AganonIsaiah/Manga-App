"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import { authConfig } from "./auth.config";
import {
  getLoginDestination,
  getSession,
  requestPasswordReset,
  signIn,
  signInToDemo,
} from "./auth.service";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const destination = getLoginDestination(params.get("next"));
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(false);
  const [reset, setReset] = useState(false);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const busy = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (getSession()) router.replace(destination);
  }, [router, destination]);

  useEffect(() => {
    heading.current?.focus();
  }, [reset]);

  async function submit(demo = false) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    setMessage("");
    try {
      if (reset && !demo) {
        setMessage(await requestPasswordReset(email));
      } else {
        if (demo) await signInToDemo(remember);
        else await signIn({ identifier, password }, remember);
        setPassword("");
        router.replace(destination);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }
  function changeView(next: boolean) {
    setReset(next);
    setError("");
    setMessage("");
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link href="/home" className="auth-brand" aria-label="Manga home">
          <BookOpen size={18} aria-hidden="true" />
          <span>Manga</span>
        </Link>
        <Link href="/home" className="auth-text-link">
          Browse as guest <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </header>
      <div className="auth-main">
        <section className="auth-form-shell" aria-labelledby="login-title">
          {reset && (
            <button
              type="button"
              className="auth-back auth-text-link"
              onClick={() => changeView(false)}
              disabled={pending}
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Back to sign in
            </button>
          )}
          <h1 id="login-title" ref={heading} tabIndex={-1}>
            {reset ? "Forgot your password?" : "Welcome back"}
          </h1>
          <p className="auth-subtitle">
            {reset
              ? "Enter the email address linked to your account."
              : "Sign in to pick up where you left off."}
          </p>
          <form onSubmit={handleSubmit} aria-busy={pending}>
            <fieldset disabled={pending} className="auth-fields">
              {reset ? (
                <label className="auth-label" htmlFor="reset-email">
                  Email address
                  <input
                    id="reset-email"
                    className="auth-input"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                      setMessage("");
                    }}
                  />
                </label>
              ) : (
                <>
                  <label className="auth-label" htmlFor="login-identifier">
                    Email or username
                    <input
                      id="login-identifier"
                      className="auth-input"
                      name="username"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      maxLength={254}
                      placeholder="Email or username"
                      value={identifier}
                      onChange={(event) => {
                        setIdentifier(event.target.value);
                        setError("");
                      }}
                    />
                  </label>
                  <div>
                    <label className="auth-label" htmlFor="login-password">
                      Password
                    </label>
                    <div className="auth-password">
                      <input
                        id="login-password"
                        className="auth-input"
                        name="password"
                        autoComplete="current-password"
                        type={visible ? "text" : "password"}
                        required
                        maxLength={256}
                        placeholder="Your password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setError("");
                        }}
                      />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        aria-label={visible ? "Hide password" : "Show password"}
                        aria-pressed={visible}
                        aria-controls="login-password"
                        onClick={() => setVisible((value) => !value)}
                      >
                        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>
                  <div className="auth-options">
                    <label className="auth-remember">
                      <input
                        type="checkbox"
                        name="remember"
                        checked={remember}
                        onChange={(event) => setRemember(event.target.checked)}
                      />
                      Remember me
                    </label>
                    <button
                      type="button"
                      className="auth-text-link"
                      onClick={() => changeView(true)}
                    >
                      Forgot password?
                    </button>
                  </div>
                </>
              )}
              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <p className="auth-message" role="status">
                  {message}
                </p>
              )}
              <button className="action-primary auth-submit" type="submit">
                {pending ? (
                  <>
                    <LoaderCircle
                      className="auth-spinner"
                      size={16}
                      aria-hidden="true"
                    />
                    {reset ? "Sending…" : "Signing in…"}
                  </>
                ) : (
                  <>
                    {reset ? "Send reset link" : "Sign in"}
                    <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>
            </fieldset>
          </form>
          {authConfig.useMocks && (
            <div className="auth-demo">
              <p>Try it out while accounts are being built.</p>
              <button
                className="action-secondary"
                disabled={pending}
                onClick={() => void submit(true)}
              >
                Use demo account
              </button>
            </div>
          )}
        </section>
      </div>
      <footer className="auth-footer">Your stories, all in one place.</footer>
    </main>
  );
}
