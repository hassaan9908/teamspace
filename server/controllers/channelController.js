const mongoose = require("mongoose");

const Channel = require("../models/Channel");
const Workspace = require("../models/Workspace");
const User = require("../models/User");

// =============================
// HELPER
// =============================

const getWorkspaceMembership = (
  workspace,
  userId
) => {
  return workspace.members.find(
    (member) =>
      member.user.toString() ===
      userId.toString()
  );
};

// =============================
// CREATE CHANNEL
// =============================

const createChannel = async (
  req,
  res
) => {
  try {
    const { workspaceId } =
      req.params;

    const {
      name,
      description,
      type,
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

    if (!name?.trim()) {
      return res.status(400).json({
        message:
          "Channel name is required.",
      });
    }

    if (
      type &&
      ![
        "public",
        "private",
      ].includes(type)
    ) {
      return res.status(400).json({
        message:
          "Invalid channel type.",
      });
    }

    const workspace =
      await Workspace.findById(
        workspaceId
      );

    if (!workspace) {
      return res.status(404).json({
        message:
          "Workspace not found.",
      });
    }

    const membership =
      getWorkspaceMembership(
        workspace,
        req.user._id
      );

    if (!membership) {
      return res.status(403).json({
        message:
          "You are not a member of this workspace.",
      });
    }

    if (
      !["owner", "admin"].includes(
        membership.role
      )
    ) {
      return res.status(403).json({
        message:
          "Only workspace owners and admins can create channels.",
      });
    }

    const normalizedName =
      name
        .trim()
        .toLowerCase();

    const existingChannel =
      await Channel.findOne({
        workspace: workspaceId,
        name: normalizedName,
      });

    if (existingChannel) {
      return res.status(400).json({
        message:
          "A channel with this name already exists in the workspace.",
      });
    }

    const channel =
      await Channel.create({
        name:
          normalizedName,

        description:
          description?.trim() ||
          "",

        workspace:
          workspaceId,

        type:
          type || "public",

        createdBy:
          req.user._id,

        members:
          type === "private"
            ? [req.user._id]
            : [],
      });

    const populatedChannel =
      await Channel.findById(
        channel._id
      )
        .populate(
          "createdBy",
          "name email"
        )
        .populate(
          "members",
          "name email"
        );

    return res.status(201).json({
      message:
        "Channel created successfully.",

      channel:
        populatedChannel,
    });
  } catch (error) {
    console.error(
      "Create channel error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong.",
    });
  }
};

// =============================
// GET WORKSPACE CHANNELS
// =============================

const getWorkspaceChannels =
  async (req, res) => {
    try {
      const {
        workspaceId,
      } = req.params;

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

      const workspace =
        await Workspace.findById(
          workspaceId
        );

      if (!workspace) {
        return res.status(404).json({
          message:
            "Workspace not found.",
        });
      }

      const membership =
        getWorkspaceMembership(
          workspace,
          req.user._id
        );

      if (!membership) {
        return res.status(403).json({
          message:
            "You are not a member of this workspace.",
        });
      }

      const channels =
        await Channel.find({
          workspace:
            workspaceId,

          $or: [
            {
              type:
                "public",
            },

            {
              type:
                "private",

              members:
                req.user._id,
            },
          ],
        })
          .populate(
            "createdBy",
            "name email"
          )
          .populate(
            "members",
            "name email"
          )
          .sort({
            createdAt: 1,
          });

      return res.status(200).json({
        channels,
      });
    } catch (error) {
      console.error(
        "Get channels error:",
        error
      );

      return res.status(500).json({
        message:
          "Something went wrong.",
      });
    }
  };

// =============================
// GET PRIVATE CHANNEL MEMBERS
// =============================

const getPrivateChannelMembers =
  async (req, res) => {
    try {
      const {
        channelId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          channelId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid channel ID.",
        });
      }

      const channel =
        await Channel.findById(
          channelId
        ).populate(
          "members",
          "name email"
        );

      if (!channel) {
        return res.status(404).json({
          message:
            "Channel not found.",
        });
      }

      if (
        channel.type !==
        "private"
      ) {
        return res.status(400).json({
          message:
            "This is not a private channel.",
        });
      }

      const workspace =
        await Workspace.findById(
          channel.workspace
        );

      if (!workspace) {
        return res.status(404).json({
          message:
            "Workspace not found.",
        });
      }

      const membership =
        getWorkspaceMembership(
          workspace,
          req.user._id
        );

      if (!membership) {
        return res.status(403).json({
          message:
            "You are not a member of this workspace.",
        });
      }

      const hasChannelAccess =
        channel.members.some(
          (member) =>
            member._id.toString() ===
            req.user._id.toString()
        );

      if (
        !hasChannelAccess &&
        ![
          "owner",
          "admin",
        ].includes(
          membership.role
        )
      ) {
        return res.status(403).json({
          message:
            "You do not have access to this private channel.",
        });
      }

      return res.status(200).json({
        members:
          channel.members,
      });
    } catch (error) {
      console.error(
        "Get channel members error:",
        error
      );

      return res.status(500).json({
        message:
          "Something went wrong.",
      });
    }
  };

// =============================
// ADD PRIVATE CHANNEL MEMBER
// =============================

const addPrivateChannelMember =
  async (req, res) => {
    try {
      const {
        channelId,
      } = req.params;

      const {
        userId,
      } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          channelId
        ) ||
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid ID.",
        });
      }

      const channel =
        await Channel.findById(
          channelId
        );

      if (!channel) {
        return res.status(404).json({
          message:
            "Channel not found.",
        });
      }

      if (
        channel.type !==
        "private"
      ) {
        return res.status(400).json({
          message:
            "Members can only be managed for private channels.",
        });
      }

      const workspace =
        await Workspace.findById(
          channel.workspace
        );

      if (!workspace) {
        return res.status(404).json({
          message:
            "Workspace not found.",
        });
      }

      const currentMembership =
        getWorkspaceMembership(
          workspace,
          req.user._id
        );

      if (!currentMembership) {
        return res.status(403).json({
          message:
            "You are not a member of this workspace.",
        });
      }

      if (
        ![
          "owner",
          "admin",
        ].includes(
          currentMembership.role
        )
      ) {
        return res.status(403).json({
          message:
            "Only workspace owners and admins can manage private channel members.",
        });
      }

      const targetMembership =
        getWorkspaceMembership(
          workspace,
          userId
        );

      if (!targetMembership) {
        return res.status(400).json({
          message:
            "User must be a workspace member first.",
        });
      }

      const alreadyMember =
        channel.members.some(
          (memberId) =>
            memberId.toString() ===
            userId
        );

      if (alreadyMember) {
        return res.status(400).json({
          message:
            "User is already a member of this private channel.",
        });
      }

      channel.members.push(
        userId
      );

      await channel.save();

      const updatedChannel =
        await Channel.findById(
          channel._id
        )
          .populate(
            "createdBy",
            "name email"
          )
          .populate(
            "members",
            "name email"
          );

      return res.status(200).json({
        message:
          "Member added to private channel successfully.",

        channel:
          updatedChannel,
      });
    } catch (error) {
      console.error(
        "Add private channel member error:",
        error
      );

      return res.status(500).json({
        message:
          "Something went wrong.",
      });
    }
  };

// =============================
// REMOVE PRIVATE CHANNEL MEMBER
// =============================

const removePrivateChannelMember =
  async (req, res) => {
    try {
      const {
        channelId,
        memberId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          channelId
        ) ||
        !mongoose.Types.ObjectId.isValid(
          memberId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid ID.",
        });
      }

      const channel =
        await Channel.findById(
          channelId
        );

      if (!channel) {
        return res.status(404).json({
          message:
            "Channel not found.",
        });
      }

      if (
        channel.type !==
        "private"
      ) {
        return res.status(400).json({
          message:
            "Members can only be managed for private channels.",
        });
      }

      const workspace =
        await Workspace.findById(
          channel.workspace
        );

      if (!workspace) {
        return res.status(404).json({
          message:
            "Workspace not found.",
        });
      }

      const currentMembership =
        getWorkspaceMembership(
          workspace,
          req.user._id
        );

      if (!currentMembership) {
        return res.status(403).json({
          message:
            "You are not a member of this workspace.",
        });
      }

      if (
        ![
          "owner",
          "admin",
        ].includes(
          currentMembership.role
        )
      ) {
        return res.status(403).json({
          message:
            "Only workspace owners and admins can manage private channel members.",
        });
      }

      const exists =
        channel.members.some(
          (memberUserId) =>
            memberUserId.toString() ===
            memberId
        );

      if (!exists) {
        return res.status(404).json({
          message:
            "User is not a member of this private channel.",
        });
      }

      // Prevent creator from losing access
      if (
        channel.createdBy.toString() ===
        memberId
      ) {
        return res.status(400).json({
          message:
            "The channel creator cannot be removed from the private channel.",
        });
      }

      channel.members =
        channel.members.filter(
          (memberUserId) =>
            memberUserId.toString() !==
            memberId
        );

      await channel.save();

      const updatedChannel =
        await Channel.findById(
          channel._id
        )
          .populate(
            "createdBy",
            "name email"
          )
          .populate(
            "members",
            "name email"
          );

      return res.status(200).json({
        message:
          "Member removed from private channel successfully.",

        channel:
          updatedChannel,
      });
    } catch (error) {
      console.error(
        "Remove private channel member error:",
        error
      );

      return res.status(500).json({
        message:
          "Something went wrong.",
      });
    }
  };

module.exports = {
  createChannel,
  getWorkspaceChannels,
  getPrivateChannelMembers,
  addPrivateChannelMember,
  removePrivateChannelMember,
};