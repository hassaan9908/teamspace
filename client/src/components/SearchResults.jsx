import {
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useChannel } from "../context/ChannelContext";
import { useDirectMessage } from "../context/DirectMessageContext";
import { useNotifications } from "../context/NotificationContext";

export default function SearchResults({
  data,
  onTaskSelect,
  onClose,
}) {
  const navigate =
    useNavigate();

  const { user } = useAuth();

  const {
    channels,
    setCurrentChannel,
  } = useChannel();

  const {
    conversations,
    setCurrentConversation,
  } = useDirectMessage();

  const {
    markChannelRead,
    markConversationRead,
  } = useNotifications();

  const results =
    data?.results || {};

  const counts =
    data?.counts || {};

  const channelMessages =
    results.channelMessages ||
    [];

  const directMessages =
    results.directMessages ||
    [];

  const tasks =
    results.tasks || [];

  const currentUserId =
    user?.id || user?._id;

  const openChannel =
    async (result) => {
      const channelId =
        result.channel?._id ||
        result.channel;

      if (!channelId) {
        return;
      }

      const channel =
        channels.find(
          (item) =>
            item._id ===
            channelId
        );

      if (!channel) {
        return;
      }

      setCurrentChannel(
        channel
      );

      await markChannelRead(
        channelId
      );

      navigate(
        "/channels"
      );

      onClose?.();
    };

  const openConversation =
    async (result) => {
      const conversationId =
        result.conversation?._id ||
        result.conversation;

      if (!conversationId) {
        return;
      }

      const conversation =
        conversations.find(
          (item) =>
            item._id ===
            conversationId
        );

      if (!conversation) {
        return;
      }

      setCurrentConversation(
        conversation
      );

      await markConversationRead(
        conversationId
      );

      navigate(
        "/messages"
      );

      onClose?.();
    };

  const openTask = (
  task
) => {
  navigate(
    "/tasks",
    {
      state: {
        highlightTaskId:
          task._id,
      },
    }
  );

  onClose?.();
};

  const getOtherParticipant = (
    conversation
  ) => {
    return conversation
      ?.participants
      ?.find(
        (participant) =>
          (participant._id ||
            participant.id) !==
          currentUserId
      );
  };

  if (
    counts.total === 0
  ) {
    return (
      <div className="search-results-empty">
        <div className="search-results-empty-icon">
          ⌕
        </div>

        <strong>
          No results found
        </strong>

        <p>
          Nothing matched{" "}
          <span>
            "{data.query}"
          </span>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="search-results-summary">
        <span>
          Results for
        </span>

        <strong>
          "{data.query}"
        </strong>
      </div>

      {channelMessages.length >
        0 && (
        <section className="search-result-group">
          <div className="search-result-group-heading">
            <div>
              <span className="search-result-group-icon">
                #
              </span>

              <strong>
                Channel Messages
              </strong>
            </div>

            <span>
              {
                channelMessages.length
              }
            </span>
          </div>

          <div className="search-result-list">
            {channelMessages.map(
              (message) => (
                <button
                  key={
                    message._id
                  }
                  type="button"
                  className="search-result-item"
                  onClick={() =>
                    openChannel(
                      message
                    )
                  }
                >
                  <div className="search-result-avatar">
                    #
                  </div>

                  <div className="search-result-content">
                    <div className="search-result-title">
                      <strong>
                        #
                        {
                          message
                            .channel
                            ?.name
                        }
                      </strong>

                      <span>
                        {new Date(
                          message.createdAt
                        ).toLocaleDateString(
                          [],
                          {
                            month:
                              "short",
                            day:
                              "numeric",
                          }
                        )}
                      </span>
                    </div>

                    <p>
                      <strong>
                        {
                          message
                            .sender
                            ?.name
                        }
                      </strong>
                      {" · "}
                      {message.content ||
                        "Attachment"}
                    </p>
                  </div>

                  <span className="search-result-arrow">
                    →
                  </span>
                </button>
              )
            )}
          </div>
        </section>
      )}

      {directMessages.length >
        0 && (
        <section className="search-result-group">
          <div className="search-result-group-heading">
            <div>
              <span className="search-result-group-icon">
                💬
              </span>

              <strong>
                Direct Messages
              </strong>
            </div>

            <span>
              {
                directMessages.length
              }
            </span>
          </div>

          <div className="search-result-list">
            {directMessages.map(
              (message) => {
                const otherUser =
                  getOtherParticipant(
                    message.conversation
                  );

                return (
                  <button
                    key={
                      message._id
                    }
                    type="button"
                    className="search-result-item"
                    onClick={() =>
                      openConversation(
                        message
                      )
                    }
                  >
                    <div className="search-result-avatar dm">
                      {otherUser?.name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "U"}
                    </div>

                    <div className="search-result-content">
                      <div className="search-result-title">
                        <strong>
                          {otherUser?.name ||
                            "Direct Message"}
                        </strong>

                        <span>
                          {new Date(
                            message.createdAt
                          ).toLocaleDateString(
                            [],
                            {
                              month:
                                "short",
                              day:
                                "numeric",
                            }
                          )}
                        </span>
                      </div>

                      <p>
                        <strong>
                          {
                            message
                              .sender
                              ?.name
                          }
                        </strong>
                        {" · "}
                        {message.content ||
                          "Attachment"}
                      </p>
                    </div>

                    <span className="search-result-arrow">
                      →
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </section>
      )}

      {tasks.length >
        0 && (
        <section className="search-result-group">
          <div className="search-result-group-heading">
            <div>
              <span className="search-result-group-icon">
                ✓
              </span>

              <strong>
                Tasks
              </strong>
            </div>

            <span>
              {tasks.length}
            </span>
          </div>

          <div className="search-result-list">
            {tasks.map(
              (task) => (
                <button
                  key={
                    task._id
                  }
                  type="button"
                  className="search-result-item"
                  onClick={() =>
                    openTask(task)
                  }
                >
                  <div className="search-result-avatar task">
                    ✓
                  </div>

                  <div className="search-result-content">
                    <div className="search-result-title">
                      <strong>
                        {task.title}
                      </strong>

                      <span
                        className={`search-task-priority priority-${task.priority}`}
                      >
                        {
                          task.priority
                        }
                      </span>
                    </div>

                    <p>
                      {task.description ||
                        `Status: ${task.status}`}
                    </p>
                  </div>

                  <span className="search-result-arrow">
                    →
                  </span>
                </button>
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
}