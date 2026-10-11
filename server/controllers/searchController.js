const mongoose = require("mongoose");

const Workspace = require("../models/Workspace");
const Channel = require("../models/Channel");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const DirectMessage = require("../models/DirectMessage");
const Task = require("../models/Task");

const searchWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { q } = req.query;

    if (
      !mongoose.Types.ObjectId.isValid(
        workspaceId
      )
    ) {
      return res.status(400).json({
        message: "Invalid workspace ID.",
      });
    }

    if (
      !q ||
      !q.trim()
    ) {
      return res.status(400).json({
        message:
          "Search query is required.",
      });
    }

    const query = q.trim();

    const workspace =
      await Workspace.findById(
        workspaceId
      );

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found.",
      });
    }

    const isWorkspaceMember =
      workspace.members.some(
        (member) =>
          member.user.toString() ===
          req.user._id.toString()
      );

    if (!isWorkspaceMember) {
      return res.status(403).json({
        message:
          "You are not a member of this workspace.",
      });
    }

    // ==========================
    // ACCESSIBLE CHANNELS
    // ==========================

    const accessibleChannels =
      await Channel.find({
        workspace: workspaceId,

        $or: [
          {
            type: "public",
          },

          {
            type: "private",
            members: req.user._id,
          },
        ],
      }).select("_id name type");

    const channelIds =
      accessibleChannels.map(
        (channel) =>
          channel._id
      );

    // ==========================
    // CHANNEL MESSAGE SEARCH
    // ==========================

    const channelMessages =
      await Message.find({
        channel: {
          $in: channelIds,
        },

        content: {
          $regex: query,
          $options: "i",
        },
      })
        .populate(
          "sender",
          "name email"
        )
        .populate(
          "channel",
          "name type"
        )
        .sort({
          createdAt: -1,
        })
        .limit(30);

    // ==========================
    // USER CONVERSATIONS
    // ==========================

    const conversations =
      await Conversation.find({
        workspace: workspaceId,
        participants: req.user._id,
      }).select(
        "_id participants"
      );

    const conversationIds =
      conversations.map(
        (conversation) =>
          conversation._id
      );

    // ==========================
    // DIRECT MESSAGE SEARCH
    // ==========================

    const directMessages =
      await DirectMessage.find({
        conversation: {
          $in: conversationIds,
        },

        content: {
          $regex: query,
          $options: "i",
        },
      })
        .populate(
          "sender",
          "name email"
        )
        .populate({
          path: "conversation",

          populate: {
            path: "participants",
            select:
              "name email",
          },
        })
        .sort({
          createdAt: -1,
        })
        .limit(30);

    // ==========================
    // TASK SEARCH
    // ==========================

    const tasks =
      await Task.find({
        workspace: workspaceId,

        $or: [
          {
            title: {
              $regex: query,
              $options: "i",
            },
          },

          {
            description: {
              $regex: query,
              $options: "i",
            },
          },
        ],
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
          updatedAt: -1,
        })
        .limit(30);

    return res.status(200).json({
      query,

      results: {
        channelMessages,
        directMessages,
        tasks,
      },

      counts: {
        channelMessages:
          channelMessages.length,

        directMessages:
          directMessages.length,

        tasks:
          tasks.length,

        total:
          channelMessages.length +
          directMessages.length +
          tasks.length,
      },
    });
  } catch (error) {
    console.error(
      "Global search error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong.",
    });
  }
};

module.exports = {
  searchWorkspace,
};