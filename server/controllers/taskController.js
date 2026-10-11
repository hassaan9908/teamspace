const mongoose = require("mongoose");

const Task = require("../models/Task");
const Workspace = require(
  "../models/Workspace"
);

const getWorkspaceAccess = async (
  workspaceId,
  userId
) => {
  const workspace =
    await Workspace.findById(
      workspaceId
    );

  if (!workspace) {
    return {
      error: "Workspace not found.",
      status: 404,
    };
  }

  const membership =
    workspace.members.find(
      (member) =>
        member.user.toString() ===
        userId.toString()
    );

  if (!membership) {
    return {
      error:
        "You are not a member of this workspace.",
      status: 403,
    };
  }

  return {
    workspace,
    membership,
  };
};

// =============================
// GET WORKSPACE TASKS
// =============================

const getWorkspaceTasks = async (
  req,
  res
) => {
  try {
    const { workspaceId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        workspaceId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid workspace ID.",
      });
    }

    const access =
      await getWorkspaceAccess(
        workspaceId,
        req.user._id
      );

    if (access.error) {
      return res
        .status(access.status)
        .json({
          message: access.error,
        });
    }

    const tasks =
      await Task.find({
        workspace: workspaceId,
      })
        .populate(
          "assignee",
          "name email"
        )
        .populate(
          "createdBy",
          "name email"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      tasks,
    });
  } catch (error) {
    console.error(
      "Get workspace tasks error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong.",
    });
  }
};

// =============================
// CREATE TASK
// =============================

const createTask = async (
  req,
  res
) => {
  try {
    const { workspaceId } =
      req.params;

    const {
      title,
      description,
      status,
      priority,
      assignee,
      dueDate,
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(
        workspaceId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid workspace ID.",
      });
    }

    if (!title?.trim()) {
      return res.status(400).json({
        message:
          "Task title is required.",
      });
    }

    const access =
      await getWorkspaceAccess(
        workspaceId,
        req.user._id
      );

    if (access.error) {
      return res
        .status(access.status)
        .json({
          message: access.error,
        });
    }

    if (
      status &&
      ![
        "todo",
        "in-progress",
        "done",
      ].includes(status)
    ) {
      return res.status(400).json({
        message:
          "Invalid task status.",
      });
    }

    if (
      priority &&
      ![
        "low",
        "medium",
        "high",
      ].includes(priority)
    ) {
      return res.status(400).json({
        message:
          "Invalid task priority.",
      });
    }

    let assigneeId = null;

    if (assignee) {
      if (
        !mongoose.Types.ObjectId.isValid(
          assignee
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid assignee ID.",
        });
      }

      const assigneeIsMember =
        access.workspace.members.some(
          (member) =>
            member.user.toString() ===
            assignee
        );

      if (!assigneeIsMember) {
        return res.status(400).json({
          message:
            "Assignee must be a member of this workspace.",
        });
      }

      assigneeId = assignee;
    }

    const task =
      await Task.create({
        workspace: workspaceId,

        title: title.trim(),

        description:
          description?.trim() || "",

        status:
          status || "todo",

        priority:
          priority || "medium",

        assignee: assigneeId,

        createdBy:
          req.user._id,

        dueDate:
          dueDate || null,
      });

    const populatedTask =
      await Task.findById(
        task._id
      )
        .populate(
          "assignee",
          "name email"
        )
        .populate(
          "createdBy",
          "name email"
        );

    return res.status(201).json({
      message:
        "Task created successfully.",

      task: populatedTask,
    });
  } catch (error) {
    console.error(
      "Create task error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong.",
    });
  }
};

// =============================
// UPDATE TASK
// =============================

const updateTask = async (
  req,
  res
) => {
  try {
    const { taskId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        taskId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid task ID.",
      });
    }

    const task =
      await Task.findById(
        taskId
      );

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    const access =
      await getWorkspaceAccess(
        task.workspace,
        req.user._id
      );

    if (access.error) {
      return res
        .status(access.status)
        .json({
          message: access.error,
        });
    }

    const userId =
      req.user._id.toString();

    const isCreator =
      task.createdBy.toString() ===
      userId;

    const isAssignee =
      task.assignee?.toString() ===
      userId;

    const isOwnerOrAdmin =
      ["owner", "admin"].includes(
        access.membership.role
      );

    const canFullyEdit =
      isCreator ||
      isOwnerOrAdmin;

    const {
      title,
      description,
      status,
      priority,
      assignee,
      dueDate,
    } = req.body;

    // Assignee may change only task status
    if (
      !canFullyEdit &&
      isAssignee
    ) {
      const fields =
        Object.keys(req.body);

      const onlyStatus =
        fields.length === 1 &&
        fields[0] === "status";

      if (!onlyStatus) {
        return res.status(403).json({
          message:
            "Assigned users can only change task status.",
        });
      }
    }

    if (
      !canFullyEdit &&
      !isAssignee
    ) {
      return res.status(403).json({
        message:
          "You do not have permission to update this task.",
      });
    }

    if (status !== undefined) {
      if (
        ![
          "todo",
          "in-progress",
          "done",
        ].includes(status)
      ) {
        return res.status(400).json({
          message:
            "Invalid task status.",
        });
      }

      task.status = status;
    }

    if (canFullyEdit) {
      if (title !== undefined) {
        if (!title.trim()) {
          return res
            .status(400)
            .json({
              message:
                "Task title cannot be empty.",
            });
        }

        task.title =
          title.trim();
      }

      if (
        description !==
        undefined
      ) {
        task.description =
          description.trim();
      }

      if (
        priority !== undefined
      ) {
        if (
          ![
            "low",
            "medium",
            "high",
          ].includes(priority)
        ) {
          return res
            .status(400)
            .json({
              message:
                "Invalid task priority.",
            });
        }

        task.priority =
          priority;
      }

      if (assignee !== undefined) {
        if (
          assignee === null ||
          assignee === ""
        ) {
          task.assignee = null;
        } else {
          if (
            !mongoose.Types.ObjectId.isValid(
              assignee
            )
          ) {
            return res
              .status(400)
              .json({
                message:
                  "Invalid assignee ID.",
              });
          }

          const assigneeIsMember =
            access.workspace.members.some(
              (member) =>
                member.user.toString() ===
                assignee
            );

          if (!assigneeIsMember) {
            return res
              .status(400)
              .json({
                message:
                  "Assignee must be a member of this workspace.",
              });
          }

          task.assignee =
            assignee;
        }
      }

      if (dueDate !== undefined) {
        task.dueDate =
          dueDate || null;
      }
    }

    await task.save();

    const populatedTask =
      await Task.findById(
        task._id
      )
        .populate(
          "assignee",
          "name email"
        )
        .populate(
          "createdBy",
          "name email"
        );

    return res.status(200).json({
      message:
        "Task updated successfully.",

      task: populatedTask,
    });
  } catch (error) {
    console.error(
      "Update task error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong.",
    });
  }
};

// =============================
// DELETE TASK
// =============================

const deleteTask = async (
  req,
  res
) => {
  try {
    const { taskId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        taskId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid task ID.",
      });
    }

    const task =
      await Task.findById(
        taskId
      );

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    const access =
      await getWorkspaceAccess(
        task.workspace,
        req.user._id
      );

    if (access.error) {
      return res
        .status(access.status)
        .json({
          message: access.error,
        });
    }

    const isCreator =
      task.createdBy.toString() ===
      req.user._id.toString();

    const isOwnerOrAdmin =
      ["owner", "admin"].includes(
        access.membership.role
      );

    if (
      !isCreator &&
      !isOwnerOrAdmin
    ) {
      return res.status(403).json({
        message:
          "You do not have permission to delete this task.",
      });
    }

    await Task.findByIdAndDelete(
      taskId
    );

    return res.status(200).json({
      message:
        "Task deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete task error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong.",
    });
  }
};

module.exports = {
  getWorkspaceTasks,
  createTask,
  updateTask,
  deleteTask,
};