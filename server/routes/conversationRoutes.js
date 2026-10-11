const express = require("express");

const {
  getWorkspaceConversations,
  startConversation,
  getConversationMessages,
} = require(
  "../controllers/conversationController"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

router.use(protect);

router.get(
  "/workspaces/:workspaceId",
  getWorkspaceConversations
);

router.post(
  "/workspaces/:workspaceId",
  startConversation
);

router.get(
  "/:conversationId/messages",
  getConversationMessages
);

module.exports = router;