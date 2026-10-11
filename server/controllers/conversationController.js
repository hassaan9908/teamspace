const mongoose = require("mongoose");

const Conversation = require(
  "../models/Conversation"
);

const Workspace = require(
  "../models/Workspace"
);

const DirectMessage = require(
  "../models/DirectMessage"
);

const getWorkspaceConversations = async (
  req,
  res
) => {
  try {
    const { workspaceId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        workspaceId
      )
    ) {
      return res.status(400).json({
        message: "Invalid workspace ID.",
      });
    }

    const workspace =
      await Workspace.findById(
        workspaceId
      );

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found.",
      });
    }

    const isMember =
      workspace.members.some(
        (member) =>
          member.user.toString() ===
          req.user._id.toString()
      );

    if (!isMember) {
      return res.status(403).json({
        message:
          "You are not a member of this workspace.",
      });
    }

    const conversations =
      await Conversation.find({
        workspace: workspaceId,
        participants: req.user._id,
      })
        .populate(
          "participants",
          "name email"
        )
        .sort({
          updatedAt: -1,
        });

    return res.status(200).json({
      conversations,
    });
  } catch (error) {
    console.error(
      "Get conversations error:",
      error
    );

    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
};

const startConversation = async (
  req,
  res
) => {
  try {
    const { workspaceId } = req.params;
    const { userId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(
        workspaceId
      ) ||
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {
      return res.status(400).json({
        message: "Invalid ID.",
      });
    }

    if (
      userId ===
      req.user._id.toString()
    ) {
      return res.status(400).json({
        message:
          "You cannot start a conversation with yourself.",
      });
    }

    const workspace =
      await Workspace.findById(
        workspaceId
      );

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found.",
      });
    }

    const currentUserIsMember =
      workspace.members.some(
        (member) =>
          member.user.toString() ===
          req.user._id.toString()
      );

    const targetUserIsMember =
      workspace.members.some(
        (member) =>
          member.user.toString() ===
          userId
      );

    if (!currentUserIsMember) {
      return res.status(403).json({
        message:
          "You are not a member of this workspace.",
      });
    }

    if (!targetUserIsMember) {
      return res.status(400).json({
        message:
          "This user is not a member of the workspace.",
      });
    }

    let conversation =
      await Conversation.findOne({
        workspace: workspaceId,

        participants: {
          $all: [
            req.user._id,
            userId,
          ],

          $size: 2,
        },
      });

    if (!conversation) {
      conversation =
        await Conversation.create({
          workspace: workspaceId,

          participants: [
            req.user._id,
            userId,
          ],
        });
    }

    await conversation.populate(
      "participants",
      "name email"
    );

    return res.status(200).json({
      message:
        "Conversation ready.",

      conversation,
    });
  } catch (error) {
    console.error(
      "Start conversation error:",
      error
    );

    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
};

const getConversationMessages = async (
  req,
  res
) => {
  try {
    const {
      conversationId,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        conversationId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid conversation ID.",
      });
    }

    const conversation =
      await Conversation.findById(
        conversationId
      );

    if (!conversation) {
      return res.status(404).json({
        message:
          "Conversation not found.",
      });
    }

    const isParticipant =
      conversation.participants.some(
        (participantId) =>
          participantId.toString() ===
          req.user._id.toString()
      );

    if (!isParticipant) {
      return res.status(403).json({
        message:
          "You do not have access to this conversation.",
      });
    }

    const messages =
      await DirectMessage.find({
        conversation:
          conversationId,
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
      "Get direct messages error:",
      error
    );

    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
};

module.exports = {
  getWorkspaceConversations,
  startConversation,
  getConversationMessages,
};