const mongoose = require("mongoose");

const Message = require("../models/Message");
const Channel = require("../models/Channel");
const Workspace = require("../models/Workspace");

const verifyChannelAccess = async (
  channelId,
  userId
) => {
  const channel =
    await Channel.findById(channelId);

  if (!channel) {
    return {
      error: "Channel not found.",
      status: 404,
    };
  }

  const workspace =
    await Workspace.findById(
      channel.workspace
    );

  if (!workspace) {
    return {
      error: "Workspace not found.",
      status: 404,
    };
  }

  const isWorkspaceMember =
    workspace.members.some(
      (member) =>
        member.user.toString() ===
        userId.toString()
    );

  if (!isWorkspaceMember) {
    return {
      error:
        "You are not a member of this workspace.",
      status: 403,
    };
  }

  if (
    channel.type === "private" &&
    !channel.members.some(
      (memberId) =>
        memberId.toString() ===
        userId.toString()
    )
  ) {
    return {
      error:
        "You do not have access to this private channel.",
      status: 403,
    };
  }

  return {
    channel,
    workspace,
  };
};

const getChannelMessages = async (
  req,
  res
) => {
  try {
    const { channelId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        channelId
      )
    ) {
      return res.status(400).json({
        message: "Invalid channel ID.",
      });
    }

    const access =
      await verifyChannelAccess(
        channelId,
        req.user._id
      );

    if (access.error) {
      return res
        .status(access.status)
        .json({
          message: access.error,
        });
    }

    const messages =
      await Message.find({
        channel: channelId,
      })
        .populate(
          "sender",
          "name email"
        )
        .populate(
          "reactions.users",
          "name email"
        )
        .sort({
          createdAt: 1,
        });

    return res.status(200).json({
      messages,
    });
  } catch (error) {
    console.error(
      "Get messages error:",
      error
    );

    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
};

module.exports = {
  getChannelMessages,
  verifyChannelAccess,
};