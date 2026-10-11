import {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";

import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { useTasks } from "../context/TaskContext";

const columns = [
  {
    id: "todo",
    title: "Todo",
    icon: "○",
  },
  {
    id: "in-progress",
    title: "In Progress",
    icon: "◐",
  },
  {
    id: "done",
    title: "Done",
    icon: "✓",
  },
];

export default function TaskBoard({
  highlightTaskId,
}) {
  const { user } = useAuth();

  const {
    currentWorkspace,
  } = useWorkspace();

  const {
    tasks,
    loading,
    error,
    fetchTasks,
  } = useTasks();

  const [
    editingTaskId,
    setEditingTaskId,
  ] = useState(null);

  const [
    editingTitle,
    setEditingTitle,
  ] = useState("");

  const [
    editingDescription,
    setEditingDescription,
  ] = useState("");

  const [
    editingPriority,
    setEditingPriority,
  ] = useState("medium");

  const [
    editingAssignee,
    setEditingAssignee,
  ] = useState("");

  const [
    editingDueDate,
    setEditingDueDate,
  ] = useState("");

  const [
    actionError,
    setActionError,
  ] = useState("");

  const currentUserId =
    user?.id || user?._id;

  const currentMembership =
    currentWorkspace?.members?.find(
      (member) => {
        const memberId =
          member.user?._id ||
          member.user?.id ||
          member.user;

        return (
          memberId ===
          currentUserId
        );
      }
    );

  const currentRole =
    currentMembership?.role;

  const groupedTasks =
    useMemo(() => {
      return {
        todo: tasks.filter(
          (task) =>
            task.status ===
            "todo"
        ),

        "in-progress":
          tasks.filter(
            (task) =>
              task.status ===
              "in-progress"
          ),

        done: tasks.filter(
          (task) =>
            task.status ===
            "done"
        ),
      };
    }, [tasks]);

  useEffect(() => {
    if (!highlightTaskId) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        document
          .getElementById(
            `task-${highlightTaskId}`
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      }, 150);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    highlightTaskId,
    tasks,
  ]);

  const getId = (value) => {
    if (!value) {
      return null;
    }

    if (
      typeof value ===
      "string"
    ) {
      return value;
    }

    return (
      value._id ||
      value.id ||
      null
    );
  };

  const getInitials = (
    name
  ) => {
    if (!name) {
      return "?";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part
          .charAt(0)
          .toUpperCase()
      )
      .join("");
  };

  const canFullyEdit = (
    task
  ) => {
    return (
      getId(
        task.createdBy
      ) === currentUserId ||
      ["owner", "admin"].includes(
        currentRole
      )
    );
  };

  const canChangeStatus = (
    task
  ) => {
    return (
      canFullyEdit(task) ||
      getId(
        task.assignee
      ) === currentUserId
    );
  };

  const isOverdue = (
    task
  ) => {
    if (
      !task.dueDate ||
      task.status === "done"
    ) {
      return false;
    }

    const due =
      new Date(task.dueDate);

    due.setHours(
      23,
      59,
      59,
      999
    );

    return (
      due.getTime() <
      Date.now()
    );
  };

  const getDueLabel = (
    task
  ) => {
    if (!task.dueDate) {
      return "No due date";
    }

    const date =
      new Date(
        task.dueDate
      );

    return date.toLocaleDateString(
      [],
      {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !==
          new Date().getFullYear()
            ? "numeric"
            : undefined,
      }
    );
  };

  const updateStatus = async (
    taskId,
    status
  ) => {
    try {
      setActionError("");

      await api.patch(
        `/tasks/${taskId}`,
        {
          status,
        }
      );

      await fetchTasks();
    } catch (error) {
      setActionError(
        error.response?.data
          ?.message ||
          "Failed to update task status."
      );
    }
  };

  const startEditing = (
    task
  ) => {
    setEditingTaskId(
      task._id
    );

    setEditingTitle(
      task.title
    );

    setEditingDescription(
      task.description || ""
    );

    setEditingPriority(
      task.priority
    );

    setEditingAssignee(
      getId(
        task.assignee
      ) || ""
    );

    setEditingDueDate(
      task.dueDate
        ? new Date(
            task.dueDate
          )
            .toISOString()
            .split("T")[0]
        : ""
    );
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingTitle("");
    setEditingDescription("");
    setEditingPriority(
      "medium"
    );
    setEditingAssignee("");
    setEditingDueDate("");
  };

  const saveEdit = async (
    taskId
  ) => {
    if (
      !editingTitle.trim()
    ) {
      return;
    }

    try {
      setActionError("");

      await api.patch(
        `/tasks/${taskId}`,
        {
          title:
            editingTitle.trim(),

          description:
            editingDescription.trim(),

          priority:
            editingPriority,

          assignee:
            editingAssignee ||
            null,

          dueDate:
            editingDueDate ||
            null,
        }
      );

      cancelEditing();

      await fetchTasks();
    } catch (error) {
      setActionError(
        error.response?.data
          ?.message ||
          "Failed to update task."
      );
    }
  };

  const deleteTask = async (
    taskId
  ) => {
    if (
      !window.confirm(
        "Delete this task?"
      )
    ) {
      return;
    }

    try {
      setActionError("");

      await api.delete(
        `/tasks/${taskId}`
      );

      await fetchTasks();
    } catch (error) {
      setActionError(
        error.response?.data
          ?.message ||
          "Failed to delete task."
      );
    }
  };

  if (loading) {
    return (
      <div className="kanban-loading">
        <div className="loader" />

        <p>
          Loading workspace
          tasks...
        </p>
      </div>
    );
  }

  return (
    <div className="task-board-wrap">
      {error && (
        <div className="task-alert error">
          {error}
        </div>
      )}

      {actionError && (
        <div className="task-alert error">
          {actionError}
        </div>
      )}

      <div className="kanban-board">
        {columns.map(
          (column) => {
            const columnTasks =
              groupedTasks[
                column.id
              ] || [];

            return (
              <section
                key={column.id}
                className={`kanban-column column-${column.id}`}
              >
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span className="kanban-column-icon">
                      {
                        column.icon
                      }
                    </span>

                    <h3>
                      {
                        column.title
                      }
                    </h3>
                  </div>

                  <span className="kanban-count">
                    {
                      columnTasks.length
                    }
                  </span>
                </div>

                <div className="kanban-column-body">
                  {columnTasks.length ===
                    0 && (
                    <div className="kanban-empty">
                      <span>
                        {
                          column.icon
                        }
                      </span>

                      <p>
                        No{" "}
                        {column.title.toLowerCase()}{" "}
                        tasks
                      </p>
                    </div>
                  )}

                  {columnTasks.map(
                    (task) => {
                      const isEditing =
                        editingTaskId ===
                        task._id;

                      const highlighted =
                        highlightTaskId ===
                        task._id;

                      const overdue =
                        isOverdue(
                          task
                        );

                      const assignedName =
                        task.assignee
                          ?.name ||
                        "Unassigned";

                      return (
                        <article
                          id={`task-${task._id}`}
                          key={
                            task._id
                          }
                          className={`task-card ${
                            highlighted
                              ? "highlighted"
                              : ""
                          }`}
                        >
                          {isEditing ? (
                            <div className="task-edit-form">
                              <div className="task-edit-header">
                                <strong>
                                  Edit
                                  Task
                                </strong>

                                <button
                                  type="button"
                                  className="task-icon-btn"
                                  onClick={
                                    cancelEditing
                                  }
                                >
                                  ✕
                                </button>
                              </div>

                              <input
                                type="text"
                                value={
                                  editingTitle
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditingTitle(
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder="Task title"
                              />

                              <textarea
                                value={
                                  editingDescription
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditingDescription(
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder="Description"
                              />

                              <div className="task-edit-grid">
                                <label>
                                  <span>
                                    Priority
                                  </span>

                                  <select
                                    value={
                                      editingPriority
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      setEditingPriority(
                                        event
                                          .target
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

                                <label>
                                  <span>
                                    Assignee
                                  </span>

                                  <select
                                    value={
                                      editingAssignee
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      setEditingAssignee(
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                  >
                                    <option value="">
                                      Unassigned
                                    </option>

                                    {currentWorkspace
                                      ?.members
                                      ?.map(
                                        (
                                          member
                                        ) => {
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
                              </div>

                              <label className="task-date-field">
                                <span>
                                  Due
                                  date
                                </span>

                                <input
                                  type="date"
                                  value={
                                    editingDueDate
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setEditingDueDate(
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                />
                              </label>

                              <div className="task-edit-actions">
                                <button
                                  type="button"
                                  className="task-save-btn"
                                  onClick={() =>
                                    saveEdit(
                                      task._id
                                    )
                                  }
                                  disabled={
                                    !editingTitle.trim()
                                  }
                                >
                                  Save
                                  Changes
                                </button>

                                <button
                                  type="button"
                                  onClick={
                                    cancelEditing
                                  }
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="task-card-top">
                                <span
                                  className={`task-priority priority-${task.priority}`}
                                >
                                  {
                                    task.priority
                                  }
                                </span>

                                {canFullyEdit(
                                  task
                                ) && (
                                  <div className="task-card-actions">
                                    <button
                                      type="button"
                                      className="task-icon-btn"
                                      title="Edit task"
                                      onClick={() =>
                                        startEditing(
                                          task
                                        )
                                      }
                                    >
                                      ✎
                                    </button>

                                    <button
                                      type="button"
                                      className="task-icon-btn danger"
                                      title="Delete task"
                                      onClick={() =>
                                        deleteTask(
                                          task._id
                                        )
                                      }
                                    >
                                      ✕
                                    </button>
                                  </div>
                                )}
                              </div>

                              <h4 className="task-title">
                                {
                                  task.title
                                }
                              </h4>

                              {task.description && (
                                <p className="task-description">
                                  {
                                    task.description
                                  }
                                </p>
                              )}

                              <div className="task-card-divider" />

                              <div className="task-info-row">
                                <span className="task-info-label">
                                  Assignee
                                </span>

                                <div className="task-assignee">
                                  <span className="task-assignee-avatar">
                                    {task.assignee
                                      ? getInitials(
                                          assignedName
                                        )
                                      : "—"}
                                  </span>

                                  <span>
                                    {
                                      assignedName
                                    }
                                  </span>
                                </div>
                              </div>

                              <div className="task-info-row">
                                <span className="task-info-label">
                                  Due
                                </span>

                                <span
                                  className={`task-due ${
                                    overdue
                                      ? "overdue"
                                      : ""
                                  }`}
                                >
                                  {overdue &&
                                    "⚠ "}
                                  {getDueLabel(
                                    task
                                  )}
                                </span>
                              </div>

                              <div className="task-info-row">
                                <span className="task-info-label">
                                  Created
                                  by
                                </span>

                                <span className="task-created-by">
                                  {task
                                    .createdBy
                                    ?.name ||
                                    "Unknown"}
                                </span>
                              </div>

                              {canChangeStatus(
                                task
                              ) && (
                                <div className="task-status-control">
                                  <label>
                                    Status
                                  </label>

                                  <select
                                    value={
                                      task.status
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateStatus(
                                        task._id,
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                  >
                                    <option value="todo">
                                      Todo
                                    </option>

                                    <option value="in-progress">
                                      In
                                      Progress
                                    </option>

                                    <option value="done">
                                      Done
                                    </option>
                                  </select>
                                </div>
                              )}
                            </>
                          )}
                        </article>
                      );
                    }
                  )}
                </div>
              </section>
            );
          }
        )}
      </div>
    </div>
  );
}