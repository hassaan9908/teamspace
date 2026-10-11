import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate =
    useNavigate();

  const { login } =
    useAuth();

  const [
    formData,
    setFormData,
  ] = useState({
    email: "",
    password: "",
  });

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const handleChange = (
    event
  ) => {
    setFormData({
      ...formData,
      [event.target.name]:
        event.target.value,
    });

    setError("");
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (
      !formData.email.trim() ||
      !formData.password
    ) {
      setError(
        "Email and password are required."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await api.post(
          "/auth/login",
          {
            email:
              formData.email
                .trim()
                .toLowerCase(),

            password:
              formData.password,
          }
        );

      const {
        token,
        user,
      } = response.data;

      login(
        token,
        user
      );

      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );
    } catch (error) {
      setError(
        error.response?.data
          ?.message ||
          "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background-glow auth-glow-one" />
      <div className="auth-background-glow auth-glow-two" />

      <div className="auth-layout">
        <section className="auth-brand-panel">
          <div className="auth-brand">
            <div className="auth-logo">
              T
            </div>

            <div>
              <h1>
                TeamSpace
              </h1>

              <p>
                Team collaboration
                without the clutter.
              </p>
            </div>
          </div>

          <div className="auth-hero-copy">
            <p className="section-label">
              Welcome Back
            </p>

            <h2>
              Your team,
              conversations and
              work — all in one
              place.
            </h2>

            <p>
              Stay connected through
              channels and direct
              messages, share files,
              track tasks and manage
              workspaces from one
              collaborative hub.
            </p>
          </div>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span>#</span>

              <div>
                <strong>
                  Team Channels
                </strong>

                <p>
                  Public and private
                  conversations for
                  focused collaboration.
                </p>
              </div>
            </div>

            <div className="auth-feature">
              <span>💬</span>

              <div>
                <strong>
                  Real-time Messaging
                </strong>

                <p>
                  Direct messages,
                  reactions, typing and
                  presence.
                </p>
              </div>
            </div>

            <div className="auth-feature">
              <span>✓</span>

              <div>
                <strong>
                  Workspace Tasks
                </strong>

                <p>
                  Assign, prioritize and
                  track work across your
                  team.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-card">
            <div className="auth-card-header">
              <div className="auth-mobile-brand">
                <div className="auth-logo">
                  T
                </div>

                <strong>
                  TeamSpace
                </strong>
              </div>

              <p className="section-label">
                Sign In
              </p>

              <h2>
                Welcome back
              </h2>

              <p>
                Enter your account
                details to continue to
                your workspace.
              </p>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="auth-form"
            >
              <label className="auth-field">
                <span>
                  Email address
                </span>

                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                />
              </label>

              <label className="auth-field">
                <span>
                  Password
                </span>

                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={
                    formData.password
                  }
                  onChange={
                    handleChange
                  }
                />
              </label>

              {error && (
                <div className="auth-message error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={
                  loading ||
                  !formData.email.trim() ||
                  !formData.password
                }
              >
                {loading
                  ? "Signing in..."
                  : "Sign In"}
              </button>
            </form>

            <div className="auth-divider">
              <span>
                New to TeamSpace?
              </span>
            </div>

            <Link
              to="/register"
              className="auth-secondary-link"
            >
              Create an account
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}