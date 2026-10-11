import { useState } from "react";

import api from "../services/api";
import { useWorkspace } from "../context/WorkspaceContext";

export default function CreateWorkspaceForm() {
  const {
    fetchWorkspaces,
  } = useWorkspace();

  const [
    formData,
    setFormData,
  ] = useState({
    name: "",
    description: "",
  });

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
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
    setSuccess("");
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError(
        "Workspace name is required."
      );

      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post(
        "/workspaces",
        {
          name:
            formData.name.trim(),

          description:
            formData.description.trim(),
        }
      );

      setFormData({
        name: "",
        description: "",
      });

      setSuccess(
        "Workspace created successfully."
      );

      await fetchWorkspaces();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to create workspace."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="create-workspace-form"
    >
      <label className="create-workspace-field">
        <span>
          Workspace name
        </span>

        <input
          type="text"
          name="name"
          placeholder="e.g. Product Team"
          value={
            formData.name
          }
          maxLength={80}
          onChange={
            handleChange
          }
        />

        <small>
          Choose a clear name for
          your team or project.
        </small>
      </label>

      <label className="create-workspace-field">
        <span>
          Description
        </span>

        <textarea
          name="description"
          placeholder="What will your team use this workspace for?"
          value={
            formData.description
          }
          maxLength={300}
          onChange={
            handleChange
          }
        />

        <small>
          Optional — add a short
          description so members
          know the purpose of this
          workspace.
        </small>
      </label>

      {error && (
        <div className="create-workspace-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="create-workspace-message success">
          {success}
        </div>
      )}

      <div className="create-workspace-footer">
        <div className="create-workspace-summary">
          <span className="create-workspace-summary-icon">
            ◈
          </span>

          <div>
            <strong>
              New workspace
            </strong>

            <span>
              You will become the
              workspace owner.
            </span>
          </div>
        </div>

        <button
          type="submit"
          className="create-workspace-btn"
          disabled={
            loading ||
            !formData.name.trim()
          }
        >
          {loading
            ? "Creating..."
            : "Create Workspace"}
        </button>
      </div>
    </form>
  );
}