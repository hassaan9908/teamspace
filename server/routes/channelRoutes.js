const express = require("express");

const {
  createChannel,
  getWorkspaceChannels,
  getPrivateChannelMembers,
  addPrivateChannelMember,
  removePrivateChannelMember,
} = require(
  "../controllers/channelController"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const router =
  express.Router();

router.use(protect);

router.post(
  "/workspaces/:workspaceId",
  createChannel
);

router.get(
  "/workspaces/:workspaceId",
  getWorkspaceChannels
);

router.get(
  "/:channelId/members",
  getPrivateChannelMembers
);

router.post(
  "/:channelId/members",
  addPrivateChannelMember
);

router.delete(
  "/:channelId/members/:memberId",
  removePrivateChannelMember
);

module.exports = router;