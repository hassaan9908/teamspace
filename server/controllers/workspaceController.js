const Workspace = require("../models/Workspace");

const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Workspace name is required.",
      });
    }

    const workspace =
      await Workspace.create({
        name: name.trim(),
        description:
          description?.trim() || "",
        owner: req.user._id,
        members: [
          {
            user: req.user._id,
            role: "owner",
          },
        ],
      });

    return res.status(201).json({
      message:
        "Workspace created successfully.",
      workspace,
    });
  } catch (error) {
    console.error(
      "Create workspace error:",
      error
    );

    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
};

const getMyWorkspaces = async (
  req,
  res
) => {
  try {
    const workspaces =
      await Workspace.find({
        "members.user": req.user._id,
      })
        .populate(
          "members.user",
          "name email"
        )
        .sort({ createdAt: -1 });

    return res.status(200).json({
      workspaces,
    });
  } catch (error) {
    console.error(
      "Get workspaces error:",
      error
    );

    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
};

const User = require("../models/User");

const addWorkspaceMember = async (req, res) => {
    const mongoose = require("mongoose");
  try {
    const { workspaceId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
  return res.status(400).json({
    message: "Invalid workspace ID.",
  });
}
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found.",
      });
    }

    const currentMember = workspace.members.find(
      (member) =>
        member.user.toString() === req.user._id.toString()
    );

    if (
      !currentMember ||
      !["owner", "admin"].includes(currentMember.role)
    ) {
      return res.status(403).json({
        message: "You do not have permission to add members.",
      });
    }

    const userToAdd = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!userToAdd) {
      return res.status(404).json({
        message: "User with this email was not found.",
      });
    }

    const alreadyMember = workspace.members.some(
      (member) =>
        member.user.toString() === userToAdd._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        message: "User is already a workspace member.",
      });
    }

    workspace.members.push({
      user: userToAdd._id,
      role: "member",
    });

    await workspace.save();

    await workspace.populate(
      "members.user",
      "name email"
    );

    return res.status(200).json({
      message: "Member added successfully.",
      workspace,
    });
  } catch (error) {
    console.error("Add member error:", error);

    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { workspaceId, memberId } = req.params;
    const { role } = req.body;

    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role.",
      });
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found.",
      });
    }

    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only the workspace owner can change roles.",
      });
    }

    const member = workspace.members.find(
      (item) =>
        item.user.toString() === memberId
    );

    if (!member) {
      return res.status(404).json({
        message: "Member not found.",
      });
    }

    if (member.role === "owner") {
      return res.status(400).json({
        message: "Owner role cannot be changed.",
      });
    }

    member.role = role;

    await workspace.save();

    await workspace.populate(
      "members.user",
      "name email"
    );

    return res.status(200).json({
      message: "Member role updated.",
      workspace,
    });
  } catch (error) {
    console.error("Update member role error:", error);

    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
};

const removeWorkspaceMember = async (req, res) => {
  try {
    const { workspaceId, memberId } = req.params;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found.",
      });
    }

    const currentMember = workspace.members.find(
      (member) =>
        member.user.toString() === req.user._id.toString()
    );

    if (
      !currentMember ||
      !["owner", "admin"].includes(currentMember.role)
    ) {
      return res.status(403).json({
        message: "You do not have permission to remove members.",
      });
    }

    if (workspace.owner.toString() === memberId) {
      return res.status(400).json({
        message: "Workspace owner cannot be removed.",
      });
    }

    workspace.members = workspace.members.filter(
      (member) =>
        member.user.toString() !== memberId
    );

    await workspace.save();

    await workspace.populate(
      "members.user",
      "name email"
    );

    return res.status(200).json({
      message: "Member removed successfully.",
      workspace,
    });
  } catch (error) {
    console.error("Remove member error:", error);

    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
};

module.exports = {
  createWorkspace,
  getMyWorkspaces,
  addWorkspaceMember,
  updateMemberRole,
  removeWorkspaceMember,
};

