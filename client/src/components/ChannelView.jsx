import {
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../services/api";
import socket from "../socket/socket";

import { useAuth } from "../context/AuthContext";
import { useChannel } from "../context/ChannelContext";

import PrivateChannelMembers from "./PrivateChannelMembers";

export default function ChannelView() {
  const { user } = useAuth();

  const {
    currentChannel,
  } = useChannel();

  const [
    messages,
    setMessages,
  ] = useState([]);

  const [
    content,
    setContent,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    typingUsers,
    setTypingUsers,
  ] = useState([]);

  const [
    onlineUsers,
    setOnlineUsers,
  ] = useState([]);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    editingContent,
    setEditingContent,
  ] = useState("");

  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const messageListRef =
  useRef(null);

const messagesEndRef =
  useRef(null);

const fileInputRef =
  useRef(null);

  const typingTimeoutRef =
    useRef(null);

  // ==========================
  // HELPERS
  // ==========================

  const getId = (value) => {
    if (!value) {
      return null;
    }

    if (typeof value === "string") {
      return value;
    }

    return (
      value._id ||
      value.id ||
      null
    );
  };

  const isCurrentUser = (
    sender
  ) => {
    return (
      getId(sender) ===
      (user?.id || user?._id)
    );
  };

  const getInitials = (
    name
  ) => {
    if (!name) {
      return "U";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part.charAt(0)
      )
      .join("")
      .toUpperCase();
  };

  const formatTime = (
    date
  ) => {
    if (!date) {
      return "";
    }

    return new Date(
      date
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "";
    }

    return new Date(
      date
    ).toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatFileSize = (
    bytes
  ) => {
    if (
      bytes === undefined ||
      bytes === null
    ) {
      return "";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (
      bytes <
      1024 * 1024
    ) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  const getFileIcon = (
    type,
    name
  ) => {
    const lowerName =
      name?.toLowerCase() || "";

    if (
      type ===
        "application/pdf" ||
      lowerName.endsWith(
        ".pdf"
      )
    ) {
      return "📕";
    }

    if (
      lowerName.endsWith(
        ".doc"
      ) ||
      lowerName.endsWith(
        ".docx"
      )
    ) {
      return "📘";
    }

    if (
      lowerName.endsWith(
        ".xls"
      ) ||
      lowerName.endsWith(
        ".xlsx"
      )
    ) {
      return "📗";
    }

    if (
      type === "text/plain" ||
      lowerName.endsWith(
        ".txt"
      )
    ) {
      return "📄";
    }

    return "📎";
  };

  const isPdf = (
    attachment
  ) => {
    return (
      attachment?.type ===
        "application/pdf" ||
      attachment?.name
        ?.toLowerCase()
        .endsWith(".pdf")
    );
  };

  const scrollToBottom = (
  behavior = "smooth"
) => {
  const container =
    messageListRef.current;

  if (!container) {
    return;
  }

  container.scrollTo({
    top: container.scrollHeight,
    behavior,
  });
};

  // ==========================
  // LOAD MESSAGE HISTORY
  // ==========================

  useEffect(() => {
    if (!currentChannel) {
      setMessages([]);
      return;
    }

    const fetchMessages =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await api.get(
              `/messages/channels/${currentChannel._id}`
            );

          const loadedMessages =
            response.data
              .messages ||
            response.data ||
            [];

          setMessages(
            loadedMessages
          );
        } catch (error) {
          console.error(
            "Fetch channel messages error:",
            error
          );

          setError(
            error.response?.data
              ?.message ||
              "Failed to load messages."
          );
        } finally {
          setLoading(false);
        }
      };

    fetchMessages();
  }, [currentChannel?._id]);

  // ==========================
  // SOCKET CONNECTION
  // ==========================

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    const handleOnlineUsers = (
      users
    ) => {
      setOnlineUsers(
        users || []
      );
    };

    const handlePresenceUpdate =
      ({
        userId,
        online,
      }) => {
        setOnlineUsers(
          (previous) => {
            if (online) {
              if (
                previous.includes(
                  userId
                )
              ) {
                return previous;
              }

              return [
                ...previous,
                userId,
              ];
            }

            return previous.filter(
              (id) =>
                id !== userId
            );
          }
        );
      };

    socket.on(
      "online-users",
      handleOnlineUsers
    );

    socket.on(
      "presence-update",
      handlePresenceUpdate
    );

    socket.emit(
      "get-online-users"
    );

    return () => {
      socket.off(
        "online-users",
        handleOnlineUsers
      );

      socket.off(
        "presence-update",
        handlePresenceUpdate
      );
    };
  }, [user?.id]);

  // ==========================
  // CHANNEL SOCKET EVENTS
  // ==========================

  useEffect(() => {
    if (
      !currentChannel?._id
    ) {
      return;
    }

    const channelId =
      currentChannel._id;

    socket.emit(
      "join-channel",
      {
        channelId,
      }
    );

    const handleNewMessage =
      (message) => {
        if (
          getId(
            message.channel
          ) !== channelId
        ) {
          return;
        }

        setMessages(
          (previous) => {
            const exists =
              previous.some(
                (item) =>
                  item._id ===
                  message._id
              );

            if (exists) {
              return previous;
            }

            return [
              ...previous,
              message,
            ];
          }
        );
      };

    const handleMessageUpdated =
      (updatedMessage) => {
        if (
          getId(
            updatedMessage.channel
          ) !== channelId
        ) {
          return;
        }

        setMessages(
          (previous) =>
            previous.map(
              (message) =>
                message._id ===
                updatedMessage._id
                  ? updatedMessage
                  : message
            )
        );
      };

    const handleMessageDeleted =
      ({
        messageId,
        channelId:
          deletedChannelId,
      }) => {
        if (
          deletedChannelId !==
          channelId
        ) {
          return;
        }

        setMessages(
          (previous) =>
            previous.filter(
              (message) =>
                message._id !==
                messageId
            )
        );
      };

    const handleTyping =
      ({
        channelId:
          typingChannelId,
        user: typingUser,
      }) => {
        if (
          typingChannelId !==
            channelId ||
          !typingUser ||
          typingUser.id ===
            (user?.id ||
              user?._id)
        ) {
          return;
        }

        setTypingUsers(
          (previous) => {
            const exists =
              previous.some(
                (item) =>
                  item.id ===
                  typingUser.id
              );

            if (exists) {
              return previous;
            }

            return [
              ...previous,
              typingUser,
            ];
          }
        );
      };

    const handleStoppedTyping =
      ({
        channelId:
          typingChannelId,
        userId,
      }) => {
        if (
          typingChannelId !==
          channelId
        ) {
          return;
        }

        setTypingUsers(
          (previous) =>
            previous.filter(
              (item) =>
                item.id !== userId
            )
        );
      };

    socket.on(
      "new-message",
      handleNewMessage
    );

    socket.on(
      "message-updated",
      handleMessageUpdated
    );

    socket.on(
      "message-deleted",
      handleMessageDeleted
    );

    socket.on(
      "user-typing",
      handleTyping
    );

    socket.on(
      "user-stopped-typing",
      handleStoppedTyping
    );

    return () => {
      socket.emit(
        "leave-channel",
        {
          channelId,
        }
      );

      socket.off(
        "new-message",
        handleNewMessage
      );

      socket.off(
        "message-updated",
        handleMessageUpdated
      );

      socket.off(
        "message-deleted",
        handleMessageDeleted
      );

      socket.off(
        "user-typing",
        handleTyping
      );

      socket.off(
        "user-stopped-typing",
        handleStoppedTyping
      );

      setTypingUsers([]);
    };
  }, [
    currentChannel?._id,
    user?.id,
  ]);

  // ==========================
  // AUTO SCROLL
  // ==========================

  useEffect(() => {
  scrollToBottom("smooth");
}, [
  messages.length,
  typingUsers.length,
]);

  // ==========================
  // TYPING
  // ==========================

  const handleTypingInput = (
    event
  ) => {
    const value =
      event.target.value;

    setContent(value);

    if (
      !currentChannel?._id
    ) {
      return;
    }

    socket.emit(
      "typing-start",
      {
        channelId:
          currentChannel._id,
      }
    );

    if (
      typingTimeoutRef.current
    ) {
      window.clearTimeout(
        typingTimeoutRef.current
      );
    }

    typingTimeoutRef.current =
      window.setTimeout(() => {
        socket.emit(
          "typing-stop",
          {
            channelId:
              currentChannel._id,
          }
        );
      }, 1200);
  };

  const stopTyping = () => {
    if (
      !currentChannel?._id
    ) {
      return;
    }

    socket.emit(
      "typing-stop",
      {
        channelId:
          currentChannel._id,
      }
    );

    if (
      typingTimeoutRef.current
    ) {
      window.clearTimeout(
        typingTimeoutRef.current
      );

      typingTimeoutRef.current =
        null;
    }
  };

  // ==========================
  // FILE SELECTION
  // ==========================

  const handleFileChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setError(
        "Maximum file size is 10MB."
      );

      event.target.value =
        "";

      return;
    }

    setSelectedFile(file);
    setError("");
  };

  const removeSelectedFile =
    () => {
      setSelectedFile(null);

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    };

  // ==========================
  // UPLOAD FILE
  // ==========================

  const uploadFile =
    async () => {
      if (!selectedFile) {
        return null;
      }

      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const response =
        await api.post(
          "/uploads",
          formData
        );

      return (
        response.data
          .attachment ||
        response.data
      );
    };

  // ==========================
  // SEND MESSAGE
  // ==========================

  const sendMessage = async (
    event
  ) => {
    event?.preventDefault();

    if (
      !currentChannel?._id
    ) {
      return;
    }

    if (
      !content.trim() &&
      !selectedFile
    ) {
      return;
    }

    try {
      setSending(true);
      setError("");

      let attachment = null;

      if (selectedFile) {
        setUploading(true);

        attachment =
          await uploadFile();
      }

      socket.emit(
        "send-message",
        {
          channelId:
            currentChannel._id,

          content:
            content.trim(),

          attachment,
        },
        (response) => {
          setSending(false);
          setUploading(false);

          if (
            !response?.success
          ) {
            setError(
              response?.message ||
                "Failed to send message."
            );

            return;
          }

          setContent("");
          removeSelectedFile();
          stopTyping();
        }
      );
    } catch (error) {
      console.error(
        "Send message error:",
        error
      );

      setError(
        error.response?.data
          ?.message ||
          "Failed to send message."
      );

      setSending(false);
      setUploading(false);
    }
  };

  // ==========================
  // EDIT MESSAGE
  // ==========================

  const startEditing = (
    message
  ) => {
    setEditingId(
      message._id
    );

    setEditingContent(
      message.content || ""
    );
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const saveEdit = (
    messageId
  ) => {
    if (
      !editingContent.trim()
    ) {
      return;
    }

    socket.emit(
      "edit-message",
      {
        messageId,
        content:
          editingContent.trim(),
      }
    );

    cancelEditing();
  };

  // ==========================
  // DELETE MESSAGE
  // ==========================

  const deleteMessage = (
    messageId
  ) => {
    if (
      !window.confirm(
        "Delete this message?"
      )
    ) {
      return;
    }

    socket.emit(
      "delete-message",
      {
        messageId,
      }
    );
  };

  // ==========================
  // REACTIONS
  // ==========================

  const toggleReaction = (
    messageId,
    emoji
  ) => {
    socket.emit(
      "toggle-reaction",
      {
        messageId,
        emoji,
      }
    );
  };

  // ==========================
  // ATTACHMENT UI
  // ==========================

  const renderAttachment = (
    attachment
  ) => {
    if (!attachment) {
      return null;
    }

    if (
      attachment.isImage
    ) {
      return (
        <div className="message-image-wrap">
          <img
            src={attachment.url}
            alt={
              attachment.name ||
              "Attachment"
            }
            className="message-image"
          />

          <div className="attachment-meta">
            <span>
              {attachment.name}
            </span>

            <span>
              {formatFileSize(
                attachment.size
              )}
            </span>

            <a
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
            >
              Open Image
            </a>
          </div>
        </div>
      );
    }

    if (isPdf(attachment)) {
      return (
        <div className="pdf-attachment">
          <iframe
            src={attachment.url}
            title={
              attachment.name ||
              "PDF"
            }
            className="pdf-preview"
          />

          <div className="file-card">
            <div className="file-icon">
              📕
            </div>

            <div className="file-info">
              <strong>
                {attachment.name}
              </strong>

              <span>
                {formatFileSize(
                  attachment.size
                )}
              </span>
            </div>

            <a
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              className="file-link"
            >
              Open PDF
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="file-card">
        <div className="file-icon">
          {getFileIcon(
            attachment.type,
            attachment.name
          )}
        </div>

        <div className="file-info">
          <strong>
            {attachment.name}
          </strong>

          <span>
            {formatFileSize(
              attachment.size
            )}
          </span>
        </div>

        <a
          href={attachment.url}
          target="_blank"
          rel="noreferrer"
          className="file-link"
        >
          Open File
        </a>
      </div>
    );
  };

  // ==========================
  // EMPTY CHANNEL
  // ==========================

  if (!currentChannel) {
    return (
      <div className="chat-empty-state">
        <div className="chat-empty-icon">
          #
        </div>

        <h3>
          Select a channel
        </h3>

        <p>
          Choose a channel from
          the sidebar to start
          collaborating with your
          team.
        </p>
      </div>
    );
  }

  return (
    <div className="channel-view">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="channel-symbol">
            {currentChannel.type ===
            "private"
              ? "🔒"
              : "#"}
          </div>

          <div>
            <h3>
              {
                currentChannel.name
              }
            </h3>

            <p>
              {currentChannel.description ||
                (currentChannel.type ===
                "private"
                  ? "Private channel"
                  : "Workspace channel")}
            </p>
          </div>
        </div>

        <div className="chat-header-badge">
          {currentChannel.type ===
          "private"
            ? "Private"
            : "Public"}
        </div>
      </div>

      {currentChannel.type ===
        "private" && (
        <div className="private-members-wrap">
          <PrivateChannelMembers />
        </div>
      )}

      {error && (
        <div className="chat-error">
          {error}
        </div>
      )}

      <div
  ref={messageListRef}
  className="message-list"
>
        {loading ? (
          <div className="chat-loading">
            <div className="loader" />
            <p>
              Loading messages...
            </p>
          </div>
        ) : messages.length ===
          0 ? (
          <div className="channel-start">
            <div className="channel-start-icon">
              {currentChannel.type ===
              "private"
                ? "🔒"
                : "#"}
            </div>

            <h3>
              Welcome to #
              {
                currentChannel.name
              }
            </h3>

            <p>
              This is the beginning
              of this channel.
            </p>
          </div>
        ) : (
          messages.map(
            (
              message,
              index
            ) => {
              const senderId =
                getId(
                  message.sender
                );

              const senderName =
                message.sender
                  ?.name ||
                "Unknown User";

              const online =
                onlineUsers.includes(
                  senderId
                );

              const previousMessage =
                messages[
                  index - 1
                ];

              const showDateDivider =
                !previousMessage ||
                formatDate(
                  previousMessage.createdAt
                ) !==
                  formatDate(
                    message.createdAt
                  );

              const ownMessage =
                isCurrentUser(
                  message.sender
                );

              return (
                <div
                  key={
                    message._id
                  }
                >
                  {showDateDivider && (
                    <div className="date-divider">
                      <span>
                        {formatDate(
                          message.createdAt
                        )}
                      </span>
                    </div>
                  )}

                  <div className="message-row">
                    <div className="message-avatar-wrap">
                      <div className="message-avatar">
                        {getInitials(
                          senderName
                        )}
                      </div>

                      <span
                        className={`presence-dot ${
                          online
                            ? "online"
                            : "offline"
                        }`}
                      />
                    </div>

                    <div className="message-main">
                      <div className="message-meta">
                        <strong>
                          {senderName}
                        </strong>

                        <span>
                          {formatTime(
                            message.createdAt
                          )}
                        </span>

                        {message.edited && (
                          <span>
                            (edited)
                          </span>
                        )}
                      </div>

                      {editingId ===
                      message._id ? (
                        <div className="edit-message-box">
                          <textarea
                            value={
                              editingContent
                            }
                            onChange={(
                              event
                            ) =>
                              setEditingContent(
                                event
                                  .target
                                  .value
                              )
                            }
                          />

                          <div className="edit-actions">
                            <button
                              type="button"
                              onClick={() =>
                                saveEdit(
                                  message._id
                                )
                              }
                            >
                              Save
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
                          {message.content && (
                            <p className="message-text">
                              {
                                message.content
                              }
                            </p>
                          )}

                          {renderAttachment(
                            message.attachment
                          )}
                        </>
                      )}

                      {message
                        .reactions
                        ?.length >
                        0 && (
                        <div className="reaction-list">
                          {message.reactions.map(
                            (
                              reaction
                            ) => {
                              const currentUserReacted =
                                reaction.users?.some(
                                  (
                                    reactionUser
                                  ) =>
                                    getId(
                                      reactionUser
                                    ) ===
                                    (user?.id ||
                                      user?._id)
                                );

                              return (
                                <button
                                  key={
                                    reaction.emoji
                                  }
                                  type="button"
                                  className={`reaction-chip ${
                                    currentUserReacted
                                      ? "active"
                                      : ""
                                  }`}
                                  title={
                                    reaction.users
                                      ?.map(
                                        (
                                          reactionUser
                                        ) =>
                                          reactionUser.name
                                      )
                                      .filter(
                                        Boolean
                                      )
                                      .join(
                                        ", "
                                      ) ||
                                    "Reaction"
                                  }
                                  onClick={() =>
                                    toggleReaction(
                                      message._id,
                                      reaction.emoji
                                    )
                                  }
                                >
                                  <span>
                                    {
                                      reaction.emoji
                                    }
                                  </span>

                                  <span>
                                    {
                                      reaction
                                        .users
                                        ?.length
                                    }
                                  </span>
                                </button>
                              );
                            }
                          )}
                        </div>
                      )}

                      <div className="message-actions">
                        <button
                          type="button"
                          onClick={() =>
                            toggleReaction(
                              message._id,
                              "👍"
                            )
                          }
                        >
                          👍
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleReaction(
                              message._id,
                              "❤️"
                            )
                          }
                        >
                          ❤️
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleReaction(
                              message._id,
                              "😂"
                            )
                          }
                        >
                          😂
                        </button>

                        {ownMessage && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                startEditing(
                                  message
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteMessage(
                                  message._id
                                )
                              }
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          )
        )}

        {typingUsers.length >
          0 && (
          <div className="typing-indicator">
            <span className="typing-dots">
              <span />
              <span />
              <span />
            </span>

            <span>
              {typingUsers
                .map(
                  (typingUser) =>
                    typingUser.name
                )
                .join(", ")}{" "}
              {typingUsers.length ===
              1
                ? "is"
                : "are"}{" "}
              typing...
            </span>
          </div>
        )}

        
      </div>

      <div className="message-composer-wrap">
        {selectedFile && (
          <div className="selected-file">
            <div>
              <strong>
                {
                  selectedFile.name
                }
              </strong>

              <span>
                {formatFileSize(
                  selectedFile.size
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={
                removeSelectedFile
              }
            >
              ✕
            </button>
          </div>
        )}

        <form
          onSubmit={
            sendMessage
          }
          className="message-composer"
        >
          <input
            ref={
              fileInputRef
            }
            type="file"
            hidden
            accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.doc,.docx,.xls,.xlsx"
            onChange={
              handleFileChange
            }
          />

          <button
            type="button"
            className="composer-attach"
            title="Attach file"
            disabled={
              sending ||
              uploading
            }
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            ＋
          </button>

          <textarea
            rows={1}
            value={content}
            onChange={
              handleTypingInput
            }
            onBlur={
              stopTyping
            }
            onKeyDown={(
              event
            ) => {
              if (
                event.key ===
                  "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();

                sendMessage();
              }
            }}
            placeholder={`Message #${currentChannel.name}`}
            disabled={
              sending ||
              uploading
            }
          />

          <button
            type="submit"
            className="composer-send"
            disabled={
              sending ||
              uploading ||
              (!content.trim() &&
                !selectedFile)
            }
          >
            {uploading
              ? "Uploading..."
              : sending
                ? "Sending..."
                : "Send"}
          </button>
        </form>

        <div className="composer-hint">
          Enter to send ·
          Shift + Enter for a new
          line · Max attachment
          size 10MB
        </div>
      </div>
    </div>
  );
}