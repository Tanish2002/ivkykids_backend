import { GraphQLID, GraphQLObjectType, GraphQLString } from "graphql";
import { User } from "../../models";
import { UserType } from "./userType";

const TweetType: GraphQLObjectType = new GraphQLObjectType({
  name: "Tweet",
  fields: () => ({
    id: { type: GraphQLID },
    content: { type: GraphQLString },
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

export default TweetType;
