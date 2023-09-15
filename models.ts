import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, unique: true, required: true },
  name: { type: String, unique: true, required: true },
  bio: String,
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

// Define Tweet Schema
const tweetSchema = new mongoose.Schema({
  content: { type: String, unique: true, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

// Create models
const User = mongoose.model("User", userSchema);
const Tweet = mongoose.model("Tweet", tweetSchema);

export { User, Tweet };
