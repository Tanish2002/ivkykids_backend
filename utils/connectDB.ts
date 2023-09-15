import mongoose from "mongoose";

async function connectDB() {
  try {
    await mongoose.connect("monogodb://user:pass@127.0.0.1:27017/twitterDB");
    console.log("? Database connected successfully");
  } catch (error: any) {
    console.log(error.message);
    setTimeout(connectDB, 5000);
  }
}

export default connectDB;
