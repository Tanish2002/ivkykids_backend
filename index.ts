import express, { Express } from "express";
import mongoose from "mongoose";
import { getUserFromAuthorizationHeader } from "./utils";
import schema from "./schemas";
import cors from "cors";
import { default as expressPlayground } from "graphql-playground-middleware-express";
import { v2 as cloudinary } from "cloudinary";
import { createYoga } from "graphql-yoga";
import "dotenv/config";

// Mongoose Connection
const role = process.env.MONGO_ROLE;
const password = process.env.MONGO_PASSWORD;
const host = process.env.MONGO_HOST;
const db_name = process.env.MONGO_DBNAME;
mongoose.connect(
  `mongodb+srv://${role}:${password}@${host}/${db_name}?retryWrites=true&w=majority`,
);
mongoose.connection.once("open", () => {
  console.log("Connected to DATABASE");
});

// Cloudinary Config
const cloud_name = process.env.CLOUDINARY_NAME;
const api_key = process.env.CLOUDINARY_KEY;
const cloudinary_secret = process.env.CLOUDINARY_SECRET;
cloudinary.config({
  cloud_name: cloud_name,
  api_key: api_key,
  api_secret: cloudinary_secret,
});

const app: Express = express();
app.use(cors({ credentials: true }));

app.get("/", expressPlayground({ endpoint: "/graphql" }));

const yoga = createYoga({
  schema,
  context: async ({ request }) => {
    const userID = getUserFromAuthorizationHeader(
      request.headers.get("authorization"),
    );
    return { userID: userID };
  },
  graphiql: true,
});

app.use("/graphql", yoga);

app.listen("9090", () => {
  console.log(`⚡️[server]: Server is running at http://localhost:9090`);
});
