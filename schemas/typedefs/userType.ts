import {
  GraphQLID,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { User } from "../../models";

const UserType: GraphQLObjectType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLID },
    username: { type: GraphQLString },
    name: { type: GraphQLString },
    password: { type: GraphQLString },
    bio: { type: GraphQLString },
    followers: {
      type: new GraphQLList(UserType),
      async resolve(parent, _args) {
        try {
          const user = await User.findById(parent.id).populate("followers");
          if (!user) throw new Error("User not found");
          return user.followers;
        } catch (error) {
          throw new Error(`Error fetching followers: ${error}`);
        }
      },
    },
    following: {
      type: new GraphQLList(UserType),
      async resolve(parent, _args) {
        try {
          const user = await User.findById(parent.id).populate("following");
          if (!user) throw new Error("User not found");
          return user.following;
        } catch (error) {
          throw new Error(`Error fetching following: ${error}`);
        }
      },
    },
  }),
});

const UserWithTokenType: GraphQLObjectType = new GraphQLObjectType({
  name: "UserToken",
  fields: () => ({
    token: { type: GraphQLString },
    user: { type: UserType },
  }),
});

export { UserType, UserWithTokenType };
