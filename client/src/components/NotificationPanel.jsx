import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNotifications } from "../context/NotificationContext";

export default function NotificationPanel() {
  const {
    notifications,
    totalUnread,
    loading,
    markAllRead,
    openNotification,
  } = useNotifications();

  const [
    open,
    setOpen,
  ] = useState(false);

  const panelRef =
    useRef(null);

  useEffect(() => {
    const handleOutsideClick = (
      event
    ) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const formatTime = (
    date
  ) => {
    const created =
      new Date(date);

    const now =
      new Date();

    const difference =
      Math.floor(
        (now - created) /
          1000
      );

    if (difference < 60) {
      return "Just now";
    }

    if (difference < 3600) {
      return `${Math.floor(
        difference / 60
      )}m ago`;
    }

    if (difference < 86400) {
      return `${Math.floor(
        difference / 3600
      )}h ago`;
    }

    return `${Math.floor(
      difference / 86400
    )}d ago`;
  };

  const getNotificationText = (
    notification
  ) => {
    const actorName =
      notification.actor?.name ||
      "Someone";

    if (
      notification.type ===
      "channel_message"
    ) {
      const channelName =
        notification.channel?.name ||
        "channel";

      return `${actorName} sent a message in #${channelName}`;
    }

    if (
      notification.type ===
      "direct_message"
    ) {
      return `${actorName} sent you a direct message`;
    }

    return "You have a new notification";
  };

  const handleNotificationClick =
    async (
      notification
    ) => {
      await openNotification(
        notification
      );

      setOpen(false);
    };

  const handleMarkAllRead =
    async () => {
      await markAllRead();
    };

  return (
    <div
      className="notification-wrapper"
      ref={panelRef}
    >
      <button
        type="button"
        className="notification-trigger"
        aria-label="Notifications"
        title="Notifications"
        onClick={() =>
          setOpen(
            (previous) =>
              !previous
          )
        }
      >
        <span className="notification-bell">
          🔔
        </span>

        {totalUnread > 0 && (
          <span className="notification-badge">
            {totalUnread > 99
              ? "99+"
              : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <div>
              <p className="section-label">
                Activity
              </p>

              <h3>
                Notifications
              </h3>
            </div>

            {totalUnread > 0 && (
              <button
                type="button"
                className="notification-mark-all"
                onClick={
                  handleMarkAllRead
                }
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-panel-summary">
            {totalUnread > 0 ? (
              <span>
                {totalUnread} unread{" "}
                {totalUnread === 1
                  ? "notification"
                  : "notifications"}
              </span>
            ) : (
              <span>
                You're all caught up
              </span>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty">
                Loading
                notifications...
              </div>
            ) : notifications.length ===
              0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">
                  🔔
                </div>

                <strong>
                  No notifications
                </strong>

                <p>
                  New messages and
                  activity will appear
                  here.
                </p>
              </div>
            ) : (
              notifications.map(
                (
                  notification
                ) => (
                  <button
                    key={
                      notification._id
                    }
                    type="button"
                    className={`notification-item ${
                      !notification.read
                        ? "unread"
                        : ""
                    }`}
                    onClick={() =>
                      handleNotificationClick(
                        notification
                      )
                    }
                  >
                    <div
                      className={`notification-item-icon ${
                        notification.type ===
                        "direct_message"
                          ? "dm"
                          : "channel"
                      }`}
                    >
                      {notification.type ===
                      "direct_message"
                        ? "💬"
                        : "#"}
                    </div>

                    <div className="notification-item-content">
                      <p>
                        {getNotificationText(
                          notification
                        )}
                      </p>

                      <span>
                        {formatTime(
                          notification.createdAt
                        )}
                      </span>
                    </div>

                    {!notification.read && (
                      <span className="notification-unread-dot" />
                    )}
                  </button>
                )
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}