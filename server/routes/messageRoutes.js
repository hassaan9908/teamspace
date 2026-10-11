const express = require("express");

const {
  getChannelMessages,
} = require(
  "../controllers/messageController"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

router.use(protect);

router.get(
  "/channels/:channelId",
  getChannelMessages
);

module.exports = router;