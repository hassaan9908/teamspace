import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate =
    useNavigate();

  const { login } =
    useAuth();

  const [
    formData,
    setFormData,
  ] = useState({
    name: "",
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
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password
    ) {
      setError(
        "All fields are required."
      );

      return;
    }

    if (
      formData.password.length <
      6
    ) {
      setError(
        "Password must be at least 6 characters."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await api.post(
          "/auth/register",
          {
            name:
              formData.name.trim(),

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
          "Unable to create account."
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
                One space for your
                whole team.
              </p>
            </div>
          </div>

          <div className="auth-hero-copy">
            <p className="section-label">
              Start Collaborating
            </p>

            <h2>
              Build a workspace
              where your team can
              actually get work done.
            </h2>

            <p>
              Create channels, message
              teammates privately,
              share files and organize
              work through a shared
              task board.
            </p>
          </div>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span>◈</span>

              <div>
                <strong>
                  Multiple Workspaces
                </strong>

                <p>
                  Keep teams, projects
                  and departments
                  separated.
                </p>
              </div>
            </div>

            <div className="auth-feature">
              <span>⚡</span>

              <div>
                <strong>
                  Real-time Collaboration
                </strong>

                <p>
                  Instant messages,
                  notifications and
                  presence updates.
                </p>
              </div>
            </div>

            <div className="auth-feature">
              <span>🔒</span>

              <div>
                <strong>
                  Role-based Access
                </strong>

                <p>
                  Owner, admin and
                  member permissions
                  keep teams organized.
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
                Get Started
              </p>

              <h2>
                Create your account
              </h2>

              <p>
                Join TeamSpace and start
                collaborating with your
                team.
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
                  Full name
                </span>

                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Your name"
                  value={
                    formData.name
                  }
                  onChange={
                    handleChange
                  }
                />
              </label>

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
                  autoComplete="new-password"
                  placeholder="Minimum 6 characters"
                  value={
                    formData.password
                  }
                  onChange={
                    handleChange
                  }
                />

                <small>
                  Use at least 6
                  characters.
                </small>
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
                  !formData.name.trim() ||
                  !formData.email.trim() ||
                  !formData.password
                }
              >
                {loading
                  ? "Creating account..."
                  : "Create Account"}
              </button>
            </form>

            <div className="auth-divider">
              <span>
                Already have an
                account?
              </span>
            </div>

            <Link
              to="/login"
              className="auth-secondary-link"
            >
              Sign in instead
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}