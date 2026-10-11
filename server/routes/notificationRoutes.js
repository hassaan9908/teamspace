const express = require("express");

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const {
  getNotifications,
  getUnreadCount,
  getUnreadBreakdown,
  markNotificationRead,
  markChannelRead,
  markConversationRead,
  markAllRead,
} = require(
  "../controllers/notificationController"
);

const router =
  express.Router();

router.use(protect);

router.get(
  "/",
  getNotifications
);

router.get(
  "/unread-count",
  getUnreadCount
);

router.get(
  "/unread-breakdown",
  getUnreadBreakdown
);

router.patch(
  "/read-all",
  markAllRead
);

router.patch(
  "/:notificationId/read",
  markNotificationRead
);

router.patch(
  "/channels/:channelId/read",
  markChannelRead
);

router.patch(
  "/conversations/:conversationId/read",
  markConversationRead
);

module.exports = router;