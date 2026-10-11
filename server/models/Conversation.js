const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({
  workspace: 1,
  participants: 1,
});

module.exports = mongoose.model(
  "Conversation",
  conversationSchema
);