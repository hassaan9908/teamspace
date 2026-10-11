import {
  useMemo,
  useState,
} from "react";

import api from "../services/api";

import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { useDirectMessage } from "../context/DirectMessageContext";
import { useNotifications } from "../context/NotificationContext";

export default function DirectMessageSidebar() {
  const { user } = useAuth();

  const {
    currentWorkspace,
  } = useWorkspace();

  const {
    conversations,
    currentConversation,
    setCurrentConversation,
    fetchConversations,
    loading,
  } = useDirectMessage();

  const {
    unreadConversations,
    markConversationRead,
  } = useNotifications();

  const [
    startingId,
    setStartingId,
  ] = useState(null);

  const [error, setError] =
    useState("");

  const [
    showPeople,
    setShowPeople,
  ] = useState(false);

  const currentUserId =
    user?.id || user?._id;

  if (!currentWorkspace) {
    return null;
  }

  const otherMembers =
    currentWorkspace.members?.filter(
      (member) => {
        const memberId =
          member.user?._id ||
          member.user?.id ||
          member.user;

        return (
          memberId !==
          currentUserId
        );
      }
    ) || [];

  const getOtherParticipant = (
    conversation
  ) => {
    return conversation
      .participants?.find(
        (participant) =>
          (participant._id ||
            participant.id) !==
          currentUserId
      );
  };

  const sortedConversations =
    useMemo(() => {
      return [
        ...conversations,
      ].sort((a, b) => {
        const aUnread =
          unreadConversations[
            a._id
          ] || 0;

        const bUnread =
          unreadConversations[
            b._id
          ] || 0;

        if (
          aUnread !==
          bUnread
        ) {
          return (
            bUnread -
            aUnread
          );
        }

        return (
          new Date(
            b.updatedAt || 0
          ) -
          new Date(
            a.updatedAt || 0
          )
        );
      });
    }, [
      conversations,
      unreadConversations,
    ]);

  const openConversation =
    async (conversation) => {
      setCurrentConversation(
        conversation
      );

      await markConversationRead(
        conversation._id
      );
    };

  const handleStartConversation =
    async (memberId) => {
      try {
        setError("");

        setStartingId(
          memberId
        );

        const response =
          await api.post(
            `/conversations/workspaces/${currentWorkspace._id}`,
            {
              userId:
                memberId,
            }
          );

        await fetchConversations();

        setCurrentConversation(
          response.data
            .conversation
        );

        setShowPeople(false);
      } catch (error) {
        setError(
          error.response?.data
            ?.message ||
            "Failed to start conversation."
        );
      } finally {
        setStartingId(null);
      }
    };

  return (
    <div className="sidebar-nav-section">
      <div className="sidebar-section-header">
        <div>
          <span className="sidebar-section-title">
            Direct Messages
          </span>

          <span className="sidebar-section-count">
            {
              conversations.length
            }
          </span>
        </div>

        <button
          type="button"
          className="sidebar-icon-btn"
          title="Start conversation"
          onClick={() =>
            setShowPeople(
              (previous) =>
                !previous
            )
          }
        >
          +
        </button>
      </div>

      {loading && (
        <p className="sidebar-muted">
          Loading conversations...
        </p>
      )}

      {error && (
        <p className="sidebar-error">
          {error}
        </p>
      )}

      <div className="sidebar-nav-list">
        {sortedConversations.map(
          (conversation) => {
            const otherUser =
              getOtherParticipant(
                conversation
              );

            const unread =
              unreadConversations[
                conversation._id
              ] || 0;

            const selected =
              currentConversation?._id ===
              conversation._id;

            return (
              <button
                key={
                  conversation._id
                }
                type="button"
                className={`sidebar-nav-item ${
                  selected
                    ? "active"
                    : ""
                } ${
                  unread > 0
                    ? "has-unread"
                    : ""
                }`}
                onClick={() =>
                  openConversation(
                    conversation
                  )
                }
              >
                <span className="sidebar-person-avatar">
                  {otherUser?.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "U"}
                </span>

                <span className="sidebar-nav-label">
                  {otherUser?.name ||
                    "Unknown User"}
                </span>

                {unread > 0 && (
                  <span className="sidebar-unread-badge">
                    {unread > 99
                      ? "99+"
                      : unread}
                  </span>
                )}
              </button>
            );
          }
        )}

        {!loading &&
          conversations.length ===
            0 && (
            <p className="sidebar-empty-text">
              No conversations yet.
            </p>
          )}
      </div>

      {showPeople && (
        <div className="sidebar-create-panel">
          <div className="sidebar-create-heading">
            <strong>
              New Message
            </strong>

            <button
              type="button"
              className="sidebar-close-btn"
              onClick={() =>
                setShowPeople(
                  false
                )
              }
            >
              ✕
            </button>
          </div>

          <p className="sidebar-muted">
            Choose a workspace
            member.
          </p>

          <div className="sidebar-people-list">
            {otherMembers.map(
              (member) => {
                const memberUser =
                  member.user;

                const existingConversation =
                  conversations.find(
                    (
                      conversation
                    ) =>
                      conversation
                        .participants
                        ?.some(
                          (
                            participant
                          ) =>
                            (participant._id ||
                              participant.id) ===
                            memberUser?._id
                        )
                  );

                return (
                  <button
                    key={
                      memberUser?._id
                    }
                    type="button"
                    className="sidebar-person-option"
                    disabled={
                      startingId ===
                      memberUser?._id
                    }
                    onClick={() => {
                      if (
                        existingConversation
                      ) {
                        openConversation(
                          existingConversation
                        );

                        setShowPeople(
                          false
                        );

                        return;
                      }

                      handleStartConversation(
                        memberUser._id
                      );
                    }}
                  >
                    <span className="sidebar-person-avatar">
                      {memberUser?.name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "U"}
                    </span>

                    <span>
                      <strong>
                        {
                          memberUser?.name
                        }
                      </strong>

                      <small>
                        {existingConversation
                          ? "Open conversation"
                          : "Start conversation"}
                      </small>
                    </span>
                  </button>
                );
              }
            )}

            {otherMembers.length ===
              0 && (
              <p className="sidebar-empty-text">
                No other workspace
                members.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}