const express = require("express");

const {
  getWorkspaceTasks,
  createTask,
  updateTask,
  deleteTask,
} = require(
  "../controllers/taskController"
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
  getWorkspaceTasks
);

router.post(
  "/workspaces/:workspaceId",
  createTask
);

router.patch(
  "/:taskId",
  updateTask
);

router.delete(
  "/:taskId",
  deleteTask
);

module.exports = router;