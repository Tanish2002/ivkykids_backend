import express, { Express } from "express";
import { createHandler } from "graphql-http/lib/use/express";
import mongoose from "mongoose";
import { getUserFromAuthorizationHeader } from "./utils";
import schema from "./schemas";
import cors from "cors";

const expressPlayground =
  require("graphql-playground-middleware-express").default;

const app: Express = express();
mongoose.connect(
  "mongodb+srv://tanish2002:R41THMnOifyCbqXt@mongodb.tyczdzq.mongodb.net/ivykids?retryWrites=true&w=majority",
);
mongoose.connection.once("open", () => {
  console.log("Connected to DATABASE");
});

app.use(cors({ credentials: true }));

app.get("/", expressPlayground({ endpoint: "/graphql" }));

const handler = createHandler({
  schema,
  context: (req) => {
    // authenticate user and attach it to your graphql context
    const userID = getUserFromAuthorizationHeader(
      (req.headers as any).authorization,
    );

    return { userID: userID };
  },
});

app.all("/graphql", handler);

app.listen("9090", () => {
  console.log(`⚡️[server]: Server is running at http://localhost:9090`);
});
