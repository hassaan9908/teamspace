const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const channelRoutes = require("./routes/channelRoutes");
const messageRoutes = require("./routes/messageRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const taskRoutes = require("./routes/taskRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const Message = require("./models/Message");
const Channel = require("./models/Channel");
const Workspace = require("./models/Workspace");
const User = require("./models/User");
const Conversation = require("./models/Conversation");
const DirectMessage = require("./models/DirectMessage");
const Notification = require("./models/Notification");
const searchRoutes = require(
  "./routes/searchRoutes"
);
const {
  createChannelNotifications,
  createDirectMessageNotifications,
} = require("./services/notificationService");

const app = express();

connectDB();

// ==============================
// EXPRESS MIDDLEWARE
// ==============================

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

// ==============================
// API ROUTES
// ==============================

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/notifications", notificationRoutes);
app.use(
  "/api/search",
  searchRoutes
);
app.get("/", (req, res) => {
  res.json({
    message: "TeamSpace API is running",
  });
});

// ==============================
// HTTP + SOCKET.IO
// ==============================

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const onlineUsers = new Map();

// ==============================
// HELPERS
// ==============================

const getId = (value) => {
  if (!value) {
    return null;
  }

  if (value._id) {
    return value._id.toString();
  }

  return value.toString();
};

const getChannelAccess = async (
  channelId,
  userId
) => {
  const channel =
    await Channel.findById(channelId);

  if (!channel) {
    return {
      allowed: false,
      reason: "Channel not found.",
    };
  }

  const workspace =
    await Workspace.findById(
      channel.workspace
    );

  if (!workspace) {
    return {
      allowed: false,
      reason: "Workspace not found.",
    };
  }

  const workspaceMember =
    workspace.members.some(
      (member) =>
        getId(member.user) === userId
    );

  if (!workspaceMember) {
    return {
      allowed: false,
      reason:
        "User is not a workspace member.",
    };
  }

  if (channel.type === "private") {
    const privateMember =
      channel.members.some(
        (member) =>
          getId(member) === userId
      );

    if (!privateMember) {
      return {
        allowed: false,
        reason:
          "User is not a private channel member.",
      };
    }
  }

  return {
    allowed: true,
    channel,
    workspace,
  };
};

const isConversationParticipant = (
  conversation,
  userId
) => {
  return conversation.participants.some(
    (participant) =>
      getId(participant) === userId
  );
};

const sanitizeAttachment = (
  attachment
) => {
  if (!attachment) {
    return null;
  }

  const {
    url,
    publicId,
    name,
    type,
    size,
    isImage,
  } = attachment;

  if (
    !url ||
    !publicId ||
    !name ||
    !type ||
    typeof size !== "number"
  ) {
    return null;
  }

  return {
    url,
    publicId,
    name,
    type,
    size,
    isImage: Boolean(isImage),
  };
};

const emitCreatedNotifications =
  async (createdNotifications) => {
    if (
      !createdNotifications ||
      createdNotifications.length === 0
    ) {
      return;
    }

    const ids =
      createdNotifications.map(
        (notification) =>
          notification._id
      );

    const populatedNotifications =
      await Notification.find({
        _id: {
          $in: ids,
        },
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
        );

    for (const notification of populatedNotifications) {
      const recipientId =
        getId(
          notification.recipient
        );

      io.to(
        `user:${recipientId}`
      ).emit(
        "notification-created",
        notification
      );
    }
  };

// ==============================
// SOCKET AUTH
// ==============================

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token;

    if (!token) {
      return next(
        new Error(
          "Authentication required."
        )
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(
      decoded.userId
    ).select("-password");

    if (!user) {
      return next(
        new Error("User not found.")
      );
    }

    socket.user = user;

    next();
  } catch (error) {
    console.error(
      "Socket authentication error:",
      error.message
    );

    return next(
      new Error(
        "Invalid or expired token."
      )
    );
  }
});

// ==============================
// SOCKET CONNECTION
// ==============================

io.on("connection", (socket) => {
  const userId =
    socket.user._id.toString();

  console.log(
    `Socket connected: ${socket.id} - ${socket.user.name}`
  );

  // Every user gets their own room.
  // Notifications can be emitted here.
  socket.join(
    `user:${userId}`
  );

  // ==============================
  // PRESENCE
  // ==============================

  if (!onlineUsers.has(userId)) {
    onlineUsers.set(
      userId,
      new Set()
    );
  }

  onlineUsers
    .get(userId)
    .add(socket.id);

  io.emit("presence-update", {
    userId,
    online: true,
  });

  socket.on(
    "get-online-users",
    () => {
      socket.emit(
        "online-users",
        Array.from(
          onlineUsers.keys()
        )
      );
    }
  );

  // ==============================
  // CHANNEL JOIN
  // ==============================

  socket.on(
    "join-channel",
    async (
      { channelId },
      callback
    ) => {
      try {
        const access =
          await getChannelAccess(
            channelId,
            userId
          );

        if (!access.allowed) {
          if (callback) {
            callback({
              success: false,
              message:
                access.reason,
            });
          }

          return;
        }

        socket.join(channelId);

        console.log(
          `${socket.user.name} joined channel ${access.channel.name}`
        );

        if (callback) {
          callback({
            success: true,
          });
        }
      } catch (error) {
        console.error(
          "Join channel error:",
          error
        );

        if (callback) {
          callback({
            success: false,
            message:
              "Failed to join channel.",
          });
        }
      }
    }
  );

  socket.on(
    "leave-channel",
    ({ channelId }) => {
      socket.leave(channelId);
    }
  );

  // ==============================
  // SEND CHANNEL MESSAGE
  // ==============================

  socket.on(
    "send-message",
    async (
      {
        channelId,
        content,
        attachment,
      },
      callback
    ) => {
      try {
        const cleanContent =
          content?.trim() || "";

        const cleanAttachment =
          sanitizeAttachment(
            attachment
          );

        if (
          !cleanContent &&
          !cleanAttachment
        ) {
          if (callback) {
            callback({
              success: false,
              message:
                "Message must contain text or an attachment.",
            });
          }

          return;
        }

        const access =
          await getChannelAccess(
            channelId,
            userId
          );

        if (!access.allowed) {
          if (callback) {
            callback({
              success: false,
              message:
                access.reason,
            });
          }

          return;
        }

        const message =
          await Message.create({
            workspace:
              access.channel.workspace,

            channel:
              access.channel._id,

            sender:
              socket.user._id,

            content:
              cleanContent.slice(
                0,
                2000
              ),

            attachment:
              cleanAttachment,
          });

        const populatedMessage =
          await Message.findById(
            message._id
          )
            .populate(
              "sender",
              "name email"
            )
            .populate(
              "reactions.users",
              "name email"
            );

        // Send message in realtime
        io.to(channelId).emit(
          "new-message",
          populatedMessage
        );

        // Create notifications
        const createdNotifications =
          await createChannelNotifications(
            {
              workspace:
                access.workspace,

              channel:
                access.channel,

              message,

              sender:
                socket.user._id,
            }
          );

        // Send notification realtime
        await emitCreatedNotifications(
          createdNotifications
        );

        if (callback) {
          callback({
            success: true,
          });
        }
      } catch (error) {
        console.error(
          "Send message error:",
          error
        );

        if (callback) {
          callback({
            success: false,
            message:
              "Failed to send message.",
          });
        }
      }
    }
  );

  // ==============================
  // EDIT CHANNEL MESSAGE
  // ==============================

  socket.on(
    "edit-message",
    async ({
      messageId,
      content,
    }) => {
      try {
        if (!content?.trim()) {
          return;
        }

        const message =
          await Message.findById(
            messageId
          );

        if (!message) {
          return;
        }

        if (
          getId(message.sender) !==
          userId
        ) {
          return;
        }

        const access =
          await getChannelAccess(
            message.channel,
            userId
          );

        if (!access.allowed) {
          return;
        }

        message.content =
          content
            .trim()
            .slice(0, 2000);

        message.edited = true;

        await message.save();

        const updatedMessage =
          await Message.findById(
            message._id
          )
            .populate(
              "sender",
              "name email"
            )
            .populate(
              "reactions.users",
              "name email"
            );

        io.to(
          getId(message.channel)
        ).emit(
          "message-updated",
          updatedMessage
        );
      } catch (error) {
        console.error(
          "Edit message error:",
          error
        );
      }
    }
  );

  // ==============================
  // DELETE CHANNEL MESSAGE
  // ==============================

  socket.on(
    "delete-message",
    async ({
      messageId,
    }) => {
      try {
        const message =
          await Message.findById(
            messageId
          );

        if (!message) {
          return;
        }

        if (
          getId(message.sender) !==
          userId
        ) {
          return;
        }

        const access =
          await getChannelAccess(
            message.channel,
            userId
          );

        if (!access.allowed) {
          return;
        }

        const channelId =
          getId(
            message.channel
          );

        await Message.findByIdAndDelete(
          messageId
        );

        io.to(channelId).emit(
          "message-deleted",
          {
            messageId,
            channelId,
          }
        );
      } catch (error) {
        console.error(
          "Delete message error:",
          error
        );
      }
    }
  );

  // ==============================
  // CHANNEL REACTIONS
  // ==============================

  socket.on(
    "toggle-reaction",
    async ({
      messageId,
      emoji,
    }) => {
      try {
        if (!emoji) {
          return;
        }

        const message =
          await Message.findById(
            messageId
          );

        if (!message) {
          return;
        }

        const access =
          await getChannelAccess(
            message.channel,
            userId
          );

        if (!access.allowed) {
          return;
        }

        const reaction =
          message.reactions.find(
            (item) =>
              item.emoji === emoji
          );

        if (reaction) {
          const alreadyReacted =
            reaction.users.some(
              (
                reactionUserId
              ) =>
                getId(
                  reactionUserId
                ) === userId
            );

          if (alreadyReacted) {
            reaction.users =
              reaction.users.filter(
                (
                  reactionUserId
                ) =>
                  getId(
                    reactionUserId
                  ) !== userId
              );

            if (
              reaction.users
                .length === 0
            ) {
              message.reactions =
                message.reactions.filter(
                  (item) =>
                    item.emoji !==
                    emoji
                );
            }
          } else {
            reaction.users.push(
              socket.user._id
            );
          }
        } else {
          message.reactions.push({
            emoji,
            users: [
              socket.user._id,
            ],
          });
        }

        await message.save();

        const updatedMessage =
          await Message.findById(
            message._id
          )
            .populate(
              "sender",
              "name email"
            )
            .populate(
              "reactions.users",
              "name email"
            );

        io.to(
          getId(
            message.channel
          )
        ).emit(
          "message-updated",
          updatedMessage
        );
      } catch (error) {
        console.error(
          "Reaction error:",
          error
        );
      }
    }
  );

  // ==============================
  // CHANNEL TYPING
  // ==============================

  socket.on(
    "typing-start",
    ({ channelId }) => {
      if (!channelId) {
        return;
      }

      if (
        !socket.rooms.has(
          channelId
        )
      ) {
        return;
      }

      socket
        .to(channelId)
        .emit(
          "user-typing",
          {
            channelId,

            user: {
              id: userId,
              name:
                socket.user.name,
            },
          }
        );
    }
  );

  socket.on(
    "typing-stop",
    ({ channelId }) => {
      if (!channelId) {
        return;
      }

      if (
        !socket.rooms.has(
          channelId
        )
      ) {
        return;
      }

      socket
        .to(channelId)
        .emit(
          "user-stopped-typing",
          {
            channelId,
            userId,
          }
        );
    }
  );

  // ==============================
  // DIRECT MESSAGE JOIN
  // ==============================

  socket.on(
    "join-conversation",
    async ({
      conversationId,
    }) => {
      try {
        const conversation =
          await Conversation.findById(
            conversationId
          );

        if (!conversation) {
          return;
        }

        if (
          !isConversationParticipant(
            conversation,
            userId
          )
        ) {
          return;
        }

        socket.join(
          `conversation:${conversationId}`
        );
      } catch (error) {
        console.error(
          "Join conversation error:",
          error
        );
      }
    }
  );

  socket.on(
    "leave-conversation",
    ({
      conversationId,
    }) => {
      socket.leave(
        `conversation:${conversationId}`
      );
    }
  );

  // ==============================
  // SEND DIRECT MESSAGE
  // ==============================

  socket.on(
    "send-direct-message",
    async (
      {
        conversationId,
        content,
        attachment,
      },
      callback
    ) => {
      try {
        const cleanContent =
          content?.trim() || "";

        const cleanAttachment =
          sanitizeAttachment(
            attachment
          );

        if (
          !cleanContent &&
          !cleanAttachment
        ) {
          if (callback) {
            callback({
              success: false,
              message:
                "Message must contain text or an attachment.",
            });
          }

          return;
        }

        const conversation =
          await Conversation.findById(
            conversationId
          );

        if (!conversation) {
          if (callback) {
            callback({
              success: false,
              message:
                "Conversation not found.",
            });
          }

          return;
        }

        if (
          !isConversationParticipant(
            conversation,
            userId
          )
        ) {
          if (callback) {
            callback({
              success: false,
              message:
                "You do not have access to this conversation.",
            });
          }

          return;
        }

        const message =
          await DirectMessage.create({
            conversation:
              conversationId,

            sender:
              socket.user._id,

            content:
              cleanContent.slice(
                0,
                2000
              ),

            attachment:
              cleanAttachment,
          });

        await Conversation.findByIdAndUpdate(
          conversationId,
          {
            updatedAt:
              new Date(),
          }
        );

        const populatedMessage =
          await DirectMessage.findById(
            message._id
          )
            .populate(
              "sender",
              "name email"
            )
            .populate(
              "reactions.users",
              "name email"
            );

        // Realtime DM
        io.to(
          `conversation:${conversationId}`
        ).emit(
          "new-direct-message",
          populatedMessage
        );

        // Create DM notification
        const createdNotifications =
          await createDirectMessageNotifications(
            {
              conversation,
              message,
              sender:
                socket.user._id,
            }
          );

        // Emit notification realtime
        await emitCreatedNotifications(
          createdNotifications
        );

        if (callback) {
          callback({
            success: true,
          });
        }
      } catch (error) {
        console.error(
          "Direct message error:",
          error
        );

        if (callback) {
          callback({
            success: false,
            message:
              "Failed to send direct message.",
          });
        }
      }
    }
  );

  // ==============================
  // DM TYPING
  // ==============================

  socket.on(
    "dm-typing-start",
    ({
      conversationId,
    }) => {
      if (!conversationId) {
        return;
      }

      socket
        .to(
          `conversation:${conversationId}`
        )
        .emit(
          "dm-user-typing",
          {
            conversationId,

            user: {
              id: userId,
              name:
                socket.user.name,
            },
          }
        );
    }
  );

  socket.on(
    "dm-typing-stop",
    ({
      conversationId,
    }) => {
      if (!conversationId) {
        return;
      }

      socket
        .to(
          `conversation:${conversationId}`
        )
        .emit(
          "dm-user-stopped-typing",
          {
            conversationId,
            userId,
          }
        );
    }
  );

  // ==============================
  // EDIT DIRECT MESSAGE
  // ==============================

  socket.on(
    "edit-direct-message",
    async ({
      messageId,
      content,
    }) => {
      try {
        if (!content?.trim()) {
          return;
        }

        const message =
          await DirectMessage.findById(
            messageId
          );

        if (!message) {
          return;
        }

        if (
          getId(
            message.sender
          ) !== userId
        ) {
          return;
        }

        const conversation =
          await Conversation.findById(
            message.conversation
          );

        if (!conversation) {
          return;
        }

        if (
          !isConversationParticipant(
            conversation,
            userId
          )
        ) {
          return;
        }

        message.content =
          content
            .trim()
            .slice(0, 2000);

        message.edited = true;

        await message.save();

        const updatedMessage =
          await DirectMessage.findById(
            message._id
          )
            .populate(
              "sender",
              "name email"
            )
            .populate(
              "reactions.users",
              "name email"
            );

        io.to(
          `conversation:${getId(
            message.conversation
          )}`
        ).emit(
          "direct-message-updated",
          updatedMessage
        );
      } catch (error) {
        console.error(
          "Edit direct message error:",
          error
        );
      }
    }
  );

  // ==============================
  // DELETE DIRECT MESSAGE
  // ==============================

  socket.on(
    "delete-direct-message",
    async ({
      messageId,
    }) => {
      try {
        const message =
          await DirectMessage.findById(
            messageId
          );

        if (!message) {
          return;
        }

        if (
          getId(
            message.sender
          ) !== userId
        ) {
          return;
        }

        const conversationId =
          getId(
            message.conversation
          );

        await DirectMessage.findByIdAndDelete(
          messageId
        );

        io.to(
          `conversation:${conversationId}`
        ).emit(
          "direct-message-deleted",
          {
            messageId,
            conversationId,
          }
        );
      } catch (error) {
        console.error(
          "Delete direct message error:",
          error
        );
      }
    }
  );

  // ==============================
  // DM REACTIONS
  // ==============================

  socket.on(
    "toggle-direct-reaction",
    async ({
      messageId,
      emoji,
    }) => {
      try {
        if (!emoji) {
          return;
        }

        const message =
          await DirectMessage.findById(
            messageId
          );

        if (!message) {
          return;
        }

        const conversation =
          await Conversation.findById(
            message.conversation
          );

        if (!conversation) {
          return;
        }

        if (
          !isConversationParticipant(
            conversation,
            userId
          )
        ) {
          return;
        }

        const reaction =
          message.reactions.find(
            (item) =>
              item.emoji === emoji
          );

        if (reaction) {
          const alreadyReacted =
            reaction.users.some(
              (
                reactionUser
              ) =>
                getId(
                  reactionUser
                ) === userId
            );

          if (alreadyReacted) {
            reaction.users =
              reaction.users.filter(
                (
                  reactionUser
                ) =>
                  getId(
                    reactionUser
                  ) !== userId
              );

            if (
              reaction.users
                .length === 0
            ) {
              message.reactions =
                message.reactions.filter(
                  (item) =>
                    item.emoji !==
                    emoji
                );
            }
          } else {
            reaction.users.push(
              socket.user._id
            );
          }
        } else {
          message.reactions.push({
            emoji,
            users: [
              socket.user._id,
            ],
          });
        }

        await message.save();

        const updatedMessage =
          await DirectMessage.findById(
            message._id
          )
            .populate(
              "sender",
              "name email"
            )
            .populate(
              "reactions.users",
              "name email"
            );

        io.to(
          `conversation:${getId(
            message.conversation
          )}`
        ).emit(
          "direct-message-updated",
          updatedMessage
        );
      } catch (error) {
        console.error(
          "Direct message reaction error:",
          error
        );
      }
    }
  );

  // ==============================
  // DISCONNECT
  // ==============================

  socket.on(
    "disconnect",
    () => {
      const userSockets =
        onlineUsers.get(userId);

      if (userSockets) {
        userSockets.delete(
          socket.id
        );

        if (
          userSockets.size === 0
        ) {
          onlineUsers.delete(
            userId
          );

          io.emit(
            "presence-update",
            {
              userId,
              online: false,
            }
          );
        }
      }

      console.log(
        `Socket disconnected: ${socket.id} - ${socket.user.name}`
      );
    }
  );
});

// ==============================
// START SERVER
// ==============================

const PORT =
  process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});

