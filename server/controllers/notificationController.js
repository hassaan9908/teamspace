const mongoose = require("mongoose");

const Notification = require(
  "../models/Notification"
);

// =============================
// GET USER NOTIFICATIONS
// =============================

const getNotifications = async (
  req,
  res
) => {
  try {
    const notifications =
      await Notification.find({
        recipient: req.user._id,
      })
        .populate(
          "actor",
          "name email"
        )
        .populate(
          "channel",
          "name type"
        )
        .populate(
          "conversation"
        )
        .sort({
          createdAt: -1,
        })
        .limit(100);

    return res.status(200).json({
      notifications,
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong.",
    });
  }
};

// =============================
// GET UNREAD COUNT
// =============================

const getUnreadCount = async (
  req,
  res
) => {
  try {
    const count =
      await Notification.countDocuments({
        recipient: req.user._id,
        read: false,
      });

    return res.status(200).json({
      count,
    });
  } catch (error) {
    console.error(
      "Unread count error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong.",
    });
  }
};

// =============================
// GET UNREAD BREAKDOWN
// =============================

const getUnreadBreakdown = async (
  req,
  res
) => {
  try {
    const notifications =
      await Notification.find({
        recipient: req.user._id,
        read: false,
      }).select(
        "type channel conversation"
      );

    const channels = {};
    const conversations = {};

    for (const notification of notifications) {
      if (
        notification.type ===
          "channel_message" &&
        notification.channel
      ) {
        const channelId =
          notification.channel.toString();

        channels[channelId] =
          (channels[channelId] ||
            0) + 1;
      }

      if (
        notification.type ===
          "direct_message" &&
        notification.conversation
      ) {
        const conversationId =
          notification.conversation.toString();

        conversations[
          conversationId
        ] =
          (conversations[
            conversationId
          ] || 0) + 1;
      }
    }

    return res.status(200).json({
      total:
        notifications.length,
      channels,
      conversations,
    });
  } catch (error) {
    console.error(
      "Unread breakdown error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong.",
    });
  }
};

// =============================
// MARK ONE NOTIFICATION READ
// =============================

const markNotificationRead = async (
  req,
  res
) => {
  try {
    const {
      notificationId,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        notificationId
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid notification ID.",
      });
    }

    const notification =
      await Notification.findOne({
        _id: notificationId,
        recipient: req.user._id,
      });

    if (!notification) {
      return res.status(404).json({
        message:
          "Notification not found.",
      });
    }

    notification.read = true;

    await notification.save();

    return res.status(200).json({
      message:
        "Notification marked as read.",
    });
  } catch (error) {
    console.error(
      "Mark notification read error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong.",
    });
  }
};

// =============================
// MARK CHANNEL READ
// =============================

const markChannelRead = async (
  req,
  res
) => {
  try {
    const { channelId } =
      req.params;

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

    await Notification.updateMany(
      {
        recipient: req.user._id,
        channel: channelId,
        read: false,
      },
      {
        $set: {
          read: true,
        },
      }
    );

    return res.status(200).json({
      message:
        "Channel notifications marked as read.",
    });
  } catch (error) {
    console.error(
      "Mark channel read error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong.",
    });
  }
};

// =============================
// MARK CONVERSATION READ
// =============================

const markConversationRead = async (
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

    await Notification.updateMany(
      {
        recipient: req.user._id,
        conversation:
          conversationId,
        read: false,
      },
      {
        $set: {
          read: true,
        },
      }
    );

    return res.status(200).json({
      message:
        "Conversation notifications marked as read.",
    });
  } catch (error) {
    console.error(
      "Mark conversation read error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong.",
    });
  }
};

// =============================
// MARK ALL READ
// =============================

const markAllRead = async (
  req,
  res
) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        read: false,
      },
      {
        $set: {
          read: true,
        },
      }
    );

    return res.status(200).json({
      message:
        "All notifications marked as read.",
    });
  } catch (error) {
    console.error(
      "Mark all notifications error:",
      error
    );

    return res.status(500).json({
      message:
        "Something went wrong.",
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  getUnreadBreakdown,
  markNotificationRead,
  markChannelRead,
  markConversationRead,
  markAllRead,
};