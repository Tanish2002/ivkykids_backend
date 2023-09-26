import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLString,
} from "graphql";
import { User } from "../../models";
import { UserType } from "./userType";

export const FileScalar = new GraphQLScalarType({
  name: "File",
  description: "The `File` scalar type represents a file upload.",
});

const mediaType: GraphQLObjectType = new GraphQLObjectType({
  name: "Media",
  fields: () => ({
    url: { type: GraphQLString },
    publicID: { type: GraphQLString },
  }),
});

export const TweetType: GraphQLObjectType = new GraphQLObjectType({
  name: "Tweet",
  fields: () => ({
    id: { type: GraphQLID },
    content: { type: GraphQLString },
    media: { type: mediaType },
    author: {
      type: UserType,
      async resolve(parent, _args) {
        try {
          const user = await User.findById(parent.author);
          return user;
        } catch (error) {
          throw new Error(`Error fetching author: ${error}`);
        }
      },
    },
    createdAt: { type: GraphQLString },
  }),
});
