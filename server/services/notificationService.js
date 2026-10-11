const Notification = require(
  "../models/Notification"
);

const createChannelNotifications =
  async ({
    workspace,
    channel,
    message,
    sender,
  }) => {
    const senderId =
      sender.toString();

    let recipients = [];

    if (
      channel.type ===
      "private"
    ) {
      recipients =
        channel.members
          .map((member) =>
            member.toString()
          )
          .filter(
            (id) =>
              id !== senderId
          );
    } else {
      recipients =
        workspace.members
          .map((member) =>
            member.user.toString()
          )
          .filter(
            (id) =>
              id !== senderId
          );
    }

    if (
      recipients.length === 0
    ) {
      return [];
    }

    const notifications =
      recipients.map(
        (recipient) => ({
          recipient,
          actor: sender,
          workspace:
            workspace._id,
          type:
            "channel_message",
          channel:
            channel._id,
          message:
            message._id,
        })
      );

    return Notification.insertMany(
      notifications
    );
  };

const createDirectMessageNotifications =
  async ({
    conversation,
    message,
    sender,
  }) => {
    const senderId =
      sender.toString();

    const recipients =
      conversation.participants
        .map((participant) =>
          participant.toString()
        )
        .filter(
          (id) =>
            id !== senderId
        );

    if (
      recipients.length === 0
    ) {
      return [];
    }

    const notifications =
      recipients.map(
        (recipient) => ({
          recipient,
          actor: sender,
          workspace:
            conversation.workspace,
          type:
            "direct_message",
          conversation:
            conversation._id,
          directMessage:
            message._id,
        })
      );

    return Notification.insertMany(
      notifications
    );
  };

module.exports = {
  createChannelNotifications,
  createDirectMessageNotifications,
};