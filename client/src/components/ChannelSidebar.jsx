import {
  useMemo,
  useState,
} from "react";

import api from "../services/api";

import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { useChannel } from "../context/ChannelContext";
import { useNotifications } from "../context/NotificationContext";

export default function ChannelSidebar() {
  const { user } = useAuth();

  const {
    currentWorkspace,
  } = useWorkspace();

  const {
    channels,
    currentChannel,
    setCurrentChannel,
    loading,
    error,
    fetchChannels,
  } = useChannel();

  const {
    unreadChannels,
    markChannelRead,
  } = useNotifications();

  const [name, setName] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [type, setType] =
    useState("public");

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    createError,
    setCreateError,
  ] = useState("");

  const [
    showCreateForm,
    setShowCreateForm,
  ] = useState(false);

  const currentUserId =
    user?.id || user?._id;

  const currentMembership =
    currentWorkspace?.members?.find(
      (member) => {
        const memberId =
          member.user?._id ||
          member.user?.id ||
          member.user;

        return (
          memberId ===
          currentUserId
        );
      }
    );

  const canCreate =
    ["owner", "admin"].includes(
      currentMembership?.role
    );

  const sortedChannels =
    useMemo(() => {
      return [...channels].sort(
        (a, b) => {
          const aUnread =
            unreadChannels[
              a._id
            ] || 0;

          const bUnread =
            unreadChannels[
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

          return a.name.localeCompare(
            b.name
          );
        }
      );
    }, [
      channels,
      unreadChannels,
    ]);

  const handleChannelClick =
    async (channel) => {
      setCurrentChannel(
        channel
      );

      await markChannelRead(
        channel._id
      );
    };

  const handleCreateChannel =
    async (event) => {
      event.preventDefault();

      if (
        !name.trim() ||
        !currentWorkspace
      ) {
        return;
      }

      try {
        setCreating(true);
        setCreateError("");

        await api.post(
          `/channels/workspaces/${currentWorkspace._id}`,
          {
            name:
              name.trim(),
            description:
              description.trim(),
            type,
          }
        );

        setName("");
        setDescription("");
        setType("public");

        await fetchChannels();

        setShowCreateForm(
          false
        );
      } catch (error) {
        setCreateError(
          error.response?.data
            ?.message ||
            "Failed to create channel."
        );
      } finally {
        setCreating(false);
      }
    };

  if (!currentWorkspace) {
    return null;
  }

  return (
    <div className="sidebar-nav-section">
      <div className="sidebar-section-header">
        <div>
          <span className="sidebar-section-title">
            Channels
          </span>

          <span className="sidebar-section-count">
            {channels.length}
          </span>
        </div>

        {canCreate && (
          <button
            type="button"
            className="sidebar-icon-btn"
            title="Create channel"
            onClick={() =>
              setShowCreateForm(
                (previous) =>
                  !previous
              )
            }
          >
            +
          </button>
        )}
      </div>

      {loading && (
        <p className="sidebar-muted">
          Loading channels...
        </p>
      )}

      {error && (
        <p className="sidebar-error">
          {error}
        </p>
      )}

      <div className="sidebar-nav-list">
        {sortedChannels.map(
          (channel) => {
            const unread =
              unreadChannels[
                channel._id
              ] || 0;

            const selected =
              currentChannel?._id ===
              channel._id;

            return (
              <button
                key={
                  channel._id
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
                  handleChannelClick(
                    channel
                  )
                }
              >
                <span className="sidebar-nav-icon">
                  {channel.type ===
                  "private"
                    ? "🔒"
                    : "#"}
                </span>

                <span className="sidebar-nav-label">
                  {channel.name}
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
          channels.length ===
            0 && (
            <p className="sidebar-empty-text">
              No channels yet.
            </p>
          )}
      </div>

      {canCreate &&
        showCreateForm && (
        <form
          onSubmit={
            handleCreateChannel
          }
          className="sidebar-create-panel"
        >
          <div className="sidebar-create-heading">
            <strong>
              New Channel
            </strong>

            <button
              type="button"
              className="sidebar-close-btn"
              onClick={() =>
                setShowCreateForm(
                  false
                )
              }
            >
              ✕
            </button>
          </div>

          <input
            type="text"
            placeholder="Channel name"
            value={name}
            onChange={(event) =>
              setName(
                event.target
                  .value
              )
            }
          />

          <textarea
            placeholder="Description"
            value={
              description
            }
            onChange={(event) =>
              setDescription(
                event.target
                  .value
              )
            }
          />

          <select
            value={type}
            onChange={(event) =>
              setType(
                event.target
                  .value
              )
            }
          >
            <option value="public">
              Public
            </option>

            <option value="private">
              Private
            </option>
          </select>

          {createError && (
            <p className="sidebar-error">
              {createError}
            </p>
          )}

          <button
            type="submit"
            className="sidebar-primary-btn"
            disabled={
              creating ||
              !name.trim()
            }
          >
            {creating
              ? "Creating..."
              : "Create Channel"}
          </button>
        </form>
      )}
    </div>
  );
}