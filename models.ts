import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  avatar: {
    url: { type: String },
    publicID: { type: String },
  },
  bio: { type: String },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

// Define Tweet Schema
const tweetSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  media: {
    url: { type: String },
    publicID: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

// Create models
const User = mongoose.model("User", userSchema);
const Tweet = mongoose.model("Tweet", tweetSchema);

export { User, Tweet };
