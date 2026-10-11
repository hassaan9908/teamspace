const express = require(
  "express"
);

const upload = require(
  "../middleware/uploadMiddleware"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const {
  uploadAttachment,
} = require(
  "../controllers/uploadController"
);

const router =
  express.Router();

router.post(
  "/",
  protect,
  upload.single("file"),
  uploadAttachment
);

module.exports = router;