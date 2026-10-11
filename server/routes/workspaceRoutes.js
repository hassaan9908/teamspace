const express = require("express");

const {
  createWorkspace,
  getMyWorkspaces,
  addWorkspaceMember,
  updateMemberRole,
  removeWorkspaceMember,
} = require("../controllers/workspaceController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createWorkspace);
router.get("/", getMyWorkspaces);

router.post(
  "/:workspaceId/members",
  addWorkspaceMember
);

router.patch(
  "/:workspaceId/members/:memberId/role",
  updateMemberRole
);

router.delete(
  "/:workspaceId/members/:memberId",
  removeWorkspaceMember
);

module.exports = router;