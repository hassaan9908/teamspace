import {
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../services/api";
import socket from "../socket/socket";

import { useAuth } from "../context/AuthContext";
import { useDirectMessage } from "../context/DirectMessageContext";

export default function DirectMessageView() {
  const { user } = useAuth();

  const {
    currentConversation,
  } = useDirectMessage();

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

    if (
      typeof value ===
      "string"
    ) {
      return value;
    }

    return (
      value._id ||
      value.id ||
      null
    );
  };

  const currentUserId =
    user?.id || user?._id;

  const getOtherParticipant =
    () => {
      return currentConversation
        ?.participants
        ?.find(
          (participant) =>
            getId(
              participant
            ) !==
            currentUserId
        );
    };

  const otherParticipant =
    getOtherParticipant();

  const isCurrentUser = (
    sender
  ) => {
    return (
      getId(sender) ===
      currentUserId
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
const messageListRef =
  useRef(null);
  const getFileIcon = (
    type,
    name
  ) => {
    const lowerName =
      name?.toLowerCase() ||
      "";

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
    if (
      !currentConversation?._id
    ) {
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
              `/conversations/${currentConversation._id}/messages`
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
            "Fetch DM messages error:",
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
  }, [
    currentConversation?._id,
  ]);

  // ==========================
  // PRESENCE
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
  // CONVERSATION SOCKET EVENTS
  // ==========================

  useEffect(() => {
    if (
      !currentConversation?._id
    ) {
      return;
    }

    const conversationId =
      currentConversation._id;

    socket.emit(
      "join-conversation",
      {
        conversationId,
      }
    );

    const handleNewMessage =
      (message) => {
        if (
          getId(
            message.conversation
          ) !== conversationId
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

    const handleUpdatedMessage =
      (updatedMessage) => {
        if (
          getId(
            updatedMessage.conversation
          ) !== conversationId
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

    const handleDeletedMessage =
      ({
        messageId,
        conversationId:
          deletedConversationId,
      }) => {
        if (
          deletedConversationId !==
          conversationId
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
        conversationId:
          typingConversationId,
        user: typingUser,
      }) => {
        if (
          typingConversationId !==
            conversationId ||
          !typingUser ||
          typingUser.id ===
            currentUserId
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
        conversationId:
          typingConversationId,
        userId,
      }) => {
        if (
          typingConversationId !==
          conversationId
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
      "new-direct-message",
      handleNewMessage
    );

    socket.on(
      "direct-message-updated",
      handleUpdatedMessage
    );

    socket.on(
      "direct-message-deleted",
      handleDeletedMessage
    );

    socket.on(
      "dm-user-typing",
      handleTyping
    );

    socket.on(
      "dm-user-stopped-typing",
      handleStoppedTyping
    );

    return () => {
      socket.emit(
        "leave-conversation",
        {
          conversationId,
        }
      );

      socket.off(
        "new-direct-message",
        handleNewMessage
      );

      socket.off(
        "direct-message-updated",
        handleUpdatedMessage
      );

      socket.off(
        "direct-message-deleted",
        handleDeletedMessage
      );

      socket.off(
        "dm-user-typing",
        handleTyping
      );

      socket.off(
        "dm-user-stopped-typing",
        handleStoppedTyping
      );

      setTypingUsers([]);
    };
  }, [
    currentConversation?._id,
    currentUserId,
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
      !currentConversation?._id
    ) {
      return;
    }

    socket.emit(
      "dm-typing-start",
      {
        conversationId:
          currentConversation._id,
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
          "dm-typing-stop",
          {
            conversationId:
              currentConversation._id,
          }
        );
      }, 1200);
  };

  const stopTyping = () => {
    if (
      !currentConversation?._id
    ) {
      return;
    }

    socket.emit(
      "dm-typing-stop",
      {
        conversationId:
          currentConversation._id,
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
  // FILE
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
  // SEND DM
  // ==========================

  const sendMessage = async (
    event
  ) => {
    event?.preventDefault();

    if (
      !currentConversation?._id
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
        "send-direct-message",
        {
          conversationId:
            currentConversation._id,

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
        "Send DM error:",
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
  // EDIT
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
      "edit-direct-message",
      {
        messageId,
        content:
          editingContent.trim(),
      }
    );

    cancelEditing();
  };

  // ==========================
  // DELETE
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
      "delete-direct-message",
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
      "toggle-direct-reaction",
      {
        messageId,
        emoji,
      }
    );
  };

  // ==========================
  // ATTACHMENT
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
  // EMPTY
  // ==========================

  if (!currentConversation) {
    return (
      <div className="chat-empty-state">
        <div className="chat-empty-icon">
          💬
        </div>

        <h3>
          Select a conversation
        </h3>

        <p>
          Choose a team member
          from the sidebar to
          start a private
          conversation.
        </p>
      </div>
    );
  }

  const participantOnline =
    onlineUsers.includes(
      getId(
        otherParticipant
      )
    );

  return (
    <div className="dm-view">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="dm-header-avatar-wrap">
            <div className="dm-header-avatar">
              {getInitials(
                otherParticipant
                  ?.name
              )}
            </div>

            <span
              className={`presence-dot ${
                participantOnline
                  ? "online"
                  : "offline"
              }`}
            />
          </div>

          <div>
            <h3>
              {otherParticipant
                ?.name ||
                "Direct Message"}
            </h3>

            <p>
              {participantOnline
                ? "Online"
                : "Offline"}
              {otherParticipant
                ?.email
                ? ` · ${otherParticipant.email}`
                : ""}
            </p>
          </div>
        </div>

        <div
          className={`dm-status-badge ${
            participantOnline
              ? "online"
              : ""
          }`}
        >
          <span />
          {participantOnline
            ? "Online"
            : "Offline"}
        </div>
      </div>

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
            <div className="dm-start-avatar">
              {getInitials(
                otherParticipant
                  ?.name
              )}
            </div>

            <h3>
              {otherParticipant
                ?.name}
            </h3>

            <p>
              This is the beginning
              of your direct
              conversation with{" "}
              {otherParticipant
                ?.name}
              .
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

              const senderOnline =
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
                      <div
                        className={`message-avatar ${
                          ownMessage
                            ? "own-avatar"
                            : ""
                        }`}
                      >
                        {getInitials(
                          senderName
                        )}
                      </div>

                      <span
                        className={`presence-dot ${
                          senderOnline
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

                        {ownMessage && (
                          <span className="you-label">
                            You
                          </span>
                        )}

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
                                    currentUserId
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
            placeholder={`Message ${
              otherParticipant?.name ||
              ""
            }`}
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
          Enter to send · Shift +
          Enter for a new line · Max
          attachment size 10MB
        </div>
      </div>
    </div>
  );
}