const express = require("express");

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const {
  searchWorkspace,
} = require(
  "../controllers/searchController"
);

const router = express.Router();

router.use(protect);

router.get(
  "/workspaces/:workspaceId",
  searchWorkspace
);

module.exports = router;