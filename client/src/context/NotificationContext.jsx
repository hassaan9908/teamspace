import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../services/api";
import socket from "../socket/socket";

import { useAuth } from "./AuthContext";
import { useChannel } from "./ChannelContext";
import { useDirectMessage } from "./DirectMessageContext";

const NotificationContext =
  createContext(null);

export function NotificationProvider({
  children,
}) {
  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const {
    channels,
    setCurrentChannel,
  } = useChannel();

  const {
    conversations,
    setCurrentConversation,
  } = useDirectMessage();

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    unreadChannels,
    setUnreadChannels,
  ] = useState({});

  const [
    unreadConversations,
    setUnreadConversations,
  ] = useState({});

  const [
    totalUnread,
    setTotalUnread,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const currentUserId =
    user?.id || user?._id;

  // =============================
  // FETCH NOTIFICATIONS
  // =============================

  const fetchNotifications =
    async () => {
      if (!user) {
        setNotifications([]);

        return;
      }

      try {
        const response =
          await api.get(
            "/notifications"
          );

        setNotifications(
          response.data
            .notifications || []
        );
      } catch (error) {
        console.error(
          "Fetch notifications error:",
          error
        );
      }
    };

  // =============================
  // FETCH UNREAD BREAKDOWN
  // =============================

  const fetchUnreadBreakdown =
    async () => {
      if (!user) {
        setTotalUnread(0);

        setUnreadChannels(
          {}
        );

        setUnreadConversations(
          {}
        );

        return;
      }

      try {
        const response =
          await api.get(
            "/notifications/unread-breakdown"
          );

        setTotalUnread(
          response.data.total || 0
        );

        setUnreadChannels(
          response.data.channels || {}
        );

        setUnreadConversations(
          response.data
            .conversations || {}
        );
      } catch (error) {
        console.error(
          "Fetch unread breakdown error:",
          error
        );
      }
    };

  // =============================
  // REFRESH ALL
  // =============================

  const refreshNotifications =
    async () => {
      if (!user) {
        return;
      }

      try {
        setLoading(true);

        setError("");

        await Promise.all([
          fetchNotifications(),
          fetchUnreadBreakdown(),
        ]);
      } catch (error) {
        console.error(
          "Refresh notifications error:",
          error
        );

        setError(
          "Failed to load notifications."
        );
      } finally {
        setLoading(false);
      }
    };

  // =============================
  // INITIAL LOAD
  // =============================

  useEffect(() => {
    if (!user) {
      setNotifications(
        []
      );

      setTotalUnread(0);

      setUnreadChannels(
        {}
      );

      setUnreadConversations(
        {}
      );

      return;
    }

    refreshNotifications();
  }, [currentUserId]);

  // =============================
  // SOCKET CONNECTION
  // =============================

  useEffect(() => {
    if (!user) {
      return;
    }

    /*
      Important:

      Dashboard no longer mounts
      ChannelView / DMView.

      So NotificationContext must
      make sure socket itself is
      connected.
    */

    if (!socket.connected) {
      socket.connect();
    }
  }, [currentUserId]);

  // =============================
  // REAL-TIME NOTIFICATIONS
  // =============================

  useEffect(() => {
    if (!user) {
      return;
    }

    const handleNotification = (
      notification
    ) => {
      if (!notification?._id) {
        return;
      }

      console.log(
        "New notification received:",
        notification
      );

      /*
        Add notification only if it
        isn't already present.
      */

      setNotifications(
        (previous) => {
          const alreadyExists =
            previous.some(
              (item) =>
                item._id ===
                notification._id
            );

          if (
            alreadyExists
          ) {
            return previous;
          }

          return [
            notification,
            ...previous,
          ];
        }
      );

      // =========================
      // CHANNEL MESSAGE
      // =========================

      if (
        notification.type ===
          "channel_message" &&
        notification.channel
      ) {
        const channelId =
          notification.channel
            ?._id ||
          notification.channel;

        setUnreadChannels(
          (previous) => ({
            ...previous,

            [channelId]:
              (previous[
                channelId
              ] || 0) + 1,
          })
        );

        setTotalUnread(
          (previous) =>
            previous + 1
        );

        return;
      }

      // =========================
      // DIRECT MESSAGE
      // =========================

      if (
        notification.type ===
          "direct_message" &&
        notification.conversation
      ) {
        const conversationId =
          notification
            .conversation
            ?._id ||
          notification
            .conversation;

        setUnreadConversations(
          (previous) => ({
            ...previous,

            [conversationId]:
              (previous[
                conversationId
              ] || 0) + 1,
          })
        );

        setTotalUnread(
          (previous) =>
            previous + 1
        );
      }
    };

    socket.on(
      "notification-created",
      handleNotification
    );

    return () => {
      /*
        Remove ONLY this handler.

        Do not use:
        socket.off(
          "notification-created"
        )

        because that removes every
        listener for the event.
      */

      socket.off(
        "notification-created",
        handleNotification
      );
    };
  }, [currentUserId]);

  // =============================
  // MARK CHANNEL READ
  // =============================

  const markChannelRead =
    async (channelId) => {
      if (!channelId) {
        return;
      }

      try {
        await api.patch(
          `/notifications/channels/${channelId}/read`
        );

        setNotifications(
          (previous) =>
            previous.map(
              (notification) => {
                const targetId =
                  notification
                    .channel
                    ?._id ||
                  notification
                    .channel;

                if (
                  targetId ===
                  channelId
                ) {
                  return {
                    ...notification,
                    read: true,
                  };
                }

                return notification;
              }
            )
        );

        /*
          Let server be source of
          truth for unread numbers.
        */

        await fetchUnreadBreakdown();
      } catch (error) {
        console.error(
          "Mark channel read error:",
          error
        );
      }
    };

  // =============================
  // MARK CONVERSATION READ
  // =============================

  const markConversationRead =
    async (
      conversationId
    ) => {
      if (
        !conversationId
      ) {
        return;
      }

      try {
        await api.patch(
          `/notifications/conversations/${conversationId}/read`
        );

        setNotifications(
          (previous) =>
            previous.map(
              (notification) => {
                const targetId =
                  notification
                    .conversation
                    ?._id ||
                  notification
                    .conversation;

                if (
                  targetId ===
                  conversationId
                ) {
                  return {
                    ...notification,
                    read: true,
                  };
                }

                return notification;
              }
            )
        );

        await fetchUnreadBreakdown();
      } catch (error) {
        console.error(
          "Mark conversation read error:",
          error
        );
      }
    };

  // =============================
  // MARK ALL READ
  // =============================

  const markAllRead =
    async () => {
      try {
        await api.patch(
          "/notifications/read-all"
        );

        setNotifications(
          (previous) =>
            previous.map(
              (notification) => ({
                ...notification,
                read: true,
              })
            )
        );

        setUnreadChannels(
          {}
        );

        setUnreadConversations(
          {}
        );

        setTotalUnread(0);

        await fetchUnreadBreakdown();
      } catch (error) {
        console.error(
          "Mark all read error:",
          error
        );
      }
    };

  // =============================
  // OPEN NOTIFICATION
  // =============================

  const openNotification =
    async (
      notification
    ) => {
      if (!notification) {
        return;
      }

      // =========================
      // CHANNEL
      // =========================

      if (
        notification.type ===
          "channel_message" &&
        notification.channel
      ) {
        const channelId =
          notification.channel
            ?._id ||
          notification.channel;

        const channel =
          channels.find(
            (item) =>
              item._id ===
              channelId
          );

        if (!channel) {
          console.warn(
            "Notification channel not found:",
            channelId
          );

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

        return;
      }

      // =========================
      // DIRECT MESSAGE
      // =============================

      if (
        notification.type ===
          "direct_message" &&
        notification.conversation
      ) {
        const conversationId =
          notification
            .conversation
            ?._id ||
          notification
            .conversation;

        const conversation =
          conversations.find(
            (item) =>
              item._id ===
              conversationId
          );

        if (!conversation) {
          console.warn(
            "Notification conversation not found:",
            conversationId
          );

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
      }
    };

  return (
    <NotificationContext.Provider
      value={{
        notifications,

        unreadChannels,
        unreadConversations,
        totalUnread,

        loading,
        error,

        refreshNotifications,

        markChannelRead,
        markConversationRead,
        markAllRead,

        openNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context =
    useContext(
      NotificationContext
    );

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider"
    );
  }

  return context;
}