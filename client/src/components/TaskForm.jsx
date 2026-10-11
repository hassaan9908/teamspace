import {
  useState,
} from "react";

import api from "../services/api";

import { useWorkspace } from "../context/WorkspaceContext";
import { useTasks } from "../context/TaskContext";

export default function TaskForm() {
  const {
    currentWorkspace,
  } = useWorkspace();

  const {
    fetchTasks,
  } = useTasks();

  const [title, setTitle] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    priority,
    setPriority,
  ] = useState("medium");

  const [
    assignee,
    setAssignee,
  ] = useState("");

  const [
    dueDate,
    setDueDate,
  ] = useState("");

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  if (!currentWorkspace) {
    return null;
  }

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setAssignee("");
    setDueDate("");
  };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (!title.trim()) {
        return;
      }

      try {
        setCreating(true);
        setError("");
        setSuccess("");

        await api.post(
          `/tasks/workspaces/${currentWorkspace._id}`,
          {
            title:
              title.trim(),

            description:
              description.trim(),

            priority,

            assignee:
              assignee ||
              null,

            dueDate:
              dueDate ||
              null,
          }
        );

        resetForm();

        setSuccess(
          "Task created successfully."
        );

        await fetchTasks();
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Failed to create task."
        );
      } finally {
        setCreating(false);
      }
    };

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="create-task-form"
    >
      <div className="create-task-main">
        <label className="task-form-field">
          <span>
            Task title
          </span>

          <input
            type="text"
            value={title}
            maxLength={150}
            placeholder="e.g. Finish dashboard redesign"
            onChange={(event) => {
              setTitle(
                event.target.value
              );

              setSuccess("");
              setError("");
            }}
          />
        </label>

        <label className="task-form-field">
          <span>
            Description
          </span>

          <textarea
            value={
              description
            }
            maxLength={2000}
            placeholder="Add context, requirements or notes..."
            onChange={(event) =>
              setDescription(
                event.target
                  .value
              )
            }
          />
        </label>
      </div>

      <div className="create-task-options">
        <label className="task-form-field">
          <span>
            Priority
          </span>

          <select
            value={priority}
            onChange={(event) =>
              setPriority(
                event.target
                  .value
              )
            }
          >
            <option value="low">
              Low
            </option>

            <option value="medium">
              Medium
            </option>

            <option value="high">
              High
            </option>
          </select>
        </label>

        <label className="task-form-field">
          <span>
            Assignee
          </span>

          <select
            value={assignee}
            onChange={(event) =>
              setAssignee(
                event.target
                  .value
              )
            }
          >
            <option value="">
              Unassigned
            </option>

            {currentWorkspace.members?.map(
              (member) => {
                const memberUser =
                  member.user;

                return (
                  <option
                    key={
                      memberUser?._id
                    }
                    value={
                      memberUser?._id
                    }
                  >
                    {
                      memberUser?.name
                    }
                  </option>
                );
              }
            )}
          </select>
        </label>

        <label className="task-form-field">
          <span>
            Due date
          </span>

          <input
            type="date"
            value={dueDate}
            onChange={(event) =>
              setDueDate(
                event.target
                  .value
              )
            }
          />
        </label>
      </div>

      {(error || success) && (
        <div
          className={`task-form-message ${
            error
              ? "error"
              : "success"
          }`}
        >
          {error || success}
        </div>
      )}

      <div className="create-task-footer">
        <div className="task-form-summary">
          <span
            className={`task-priority priority-${priority}`}
          >
            {priority}
          </span>

          <span>
            {assignee
              ? "Assigned task"
              : "Unassigned task"}
          </span>

          {dueDate && (
            <span>
              Due{" "}
              {new Date(
                `${dueDate}T00:00:00`
              ).toLocaleDateString(
                [],
                {
                  month:
                    "short",
                  day: "numeric",
                }
              )}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="create-task-btn"
          disabled={
            creating ||
            !title.trim()
          }
        >
          {creating
            ? "Creating..."
            : "Create Task"}
        </button>
      </div>
    </form>
  );
}