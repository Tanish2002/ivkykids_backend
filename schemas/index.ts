import {
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";
import { UserWithTokenType, UserType } from "./typedefs/userType";
import { Tweet, User } from "../models";
import TweetType from "./typedefs/tweetType";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    user: {
      type: UserType,
      args: { user_id: { type: GraphQLID }, username: { type: GraphQLString } },
      resolve(_parent, args, { userID }) {
        if (!userID) {
          console.log("user Request");
          throw new Error(`Unauthorized Request`);
        }
        if (args.user_id) {
          return User.findById(args.user_id);
        } else if (args.username) {
          return User.findOne({ username: args.username });
        }
        throw new Error(`Need either user_id or username`);
      },
    },
    tweet: {
      type: TweetType,
      args: { tweet_id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve(_parent, args, { userID }) {
        if (!userID) {
          console.log("tweet Request");
          throw new Error(`Unauthorized Request`);
        }
        return Tweet.findById(args.tweet_id);
      },
    },
    tweets: {
      type: new GraphQLList(TweetType),
      args: { author_id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve(_parent, args, { userID }) {
        if (!userID) {
          console.log("tweets Request");
          throw new Error(`Unauthorized Request`);
        }
        return Tweet.find({ author: args.author_id });
      },
    },
    tweetsByFollowing: {
      type: new GraphQLList(TweetType),
      args: {
        user_id: {
          type: new GraphQLNonNull(GraphQLID),
          description: "The user_id whose followers tweet will be returned",
        },
      },
      async resolve(_parent, args, { userID }) {
        if (!userID || userID.userID !== args.user_id) {
          console.log("tweetsByFollowing Request");
          throw new Error(`Unauthorized Request`);
        }
        const user = await User.findById(args.user_id);
        if (!user) {
          throw new Error(`User not found`);
        }
        const followingIds = user.following.map((id) => id.toString());
        return Tweet.find({ author: { $in: followingIds } }).sort({
          createdAt: -1,
        });
      },
    },
    users: {
      type: new GraphQLList(UserType),
      resolve(_parent, _args, { userID }) {
        if (!userID) {
          console.log("users Request");
          throw new Error(`Unauthorized Request`);
        }
        return User.find();
      },
    },
    usersNotFollowing: {
      type: new GraphQLList(UserType),
      args: { user_id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve(_parent, args, { userID }) {
        if (!userID || userID.userID !== args.user_id) {
          console.log("usersNotFollowing Request");
          throw new Error(`Unauthorized Request`);
        }

        const userToExclude = args.user_id;

        return User.find({
          _id: { $ne: userToExclude },
          followers: { $ne: userToExclude },
        });
      },
    },
  },
});

const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addUser: {
      type: UserWithTokenType,
      args: {
        username: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
        name: { type: new GraphQLNonNull(GraphQLString) },
        bio: { type: GraphQLString },
      },
      async resolve(_parent, args) {
        const passwordHash = await bcrypt.hash(args.password, 10);
        const user = new User({
          username: args.username,
          password: passwordHash,
          name: args.name,
          bio: args.bio,
        });
        try {
          const savedUser = await user.save();
          const token = jwt.sign({ userID: savedUser._id }, "TOKEN", {
            expiresIn: "7d",
          });
          return {
            token: token,
            user: savedUser,
          };
        } catch (error) {
          throw new Error(`User not saved ${error}`);
        }
      },
    },
    loginUser: {
      type: UserWithTokenType,
      args: {
        username: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(_parent, args) {
        const user = await User.findOne({ username: args.username }).exec();
        if (!user) throw new Error("Invalid Credentials");
        const compare = await bcrypt.compare(args.password, user!.password!);
        if (!compare) throw new Error("Invalid Credentials");

        const token = jwt.sign({ userID: user._id }, "TOKEN", {
          expiresIn: "7d",
        });
        return {
          token: token,
          user: user,
        };
      },
    },
    updateUser: {
      type: UserType,
      args: {
        user_id: {
          type: new GraphQLNonNull(GraphQLString),
          description: "The username for which we need to change the data",
        },
        name: { type: GraphQLString },
        bio: { type: GraphQLString },
        followingToAdd: { type: new GraphQLList(GraphQLID) },
        followingToRemove: { type: new GraphQLList(GraphQLID) },
      },
      async resolve(_parent, args, { userID }) {
        if (!userID || userID.userID !== args.user_id) {
          console.log("updatedUser Request");
          throw new Error(`Unauthorized Request`);
        }

        try {
          let updatedUser = await User.findByIdAndUpdate(
            args.user_id,
            {
              $set: {
                name: args.name,
                bio: args.bio,
              },
            },
            { new: true },
          );

          if (!updatedUser) {
            throw new Error("User not found");
          }

          if (args.followingToAdd) {
            updatedUser = await User.findByIdAndUpdate(
              args.user_id,
              { $addToSet: { following: { $each: args.followingToAdd } } },
              { new: true },
            );

            // Add the current user from the followers list of the users they are following
            await User.updateMany(
              { _id: { $in: args.followingToAdd } },
              { $addToSet: { followers: args.user_id } },
            );
          }

          if (args.followingToRemove) {
            updatedUser = await User.findByIdAndUpdate(
              args.user_id,
              {
                $pullAll: { following: args.followingToRemove },
              },
              { new: true },
            );

            // Remove the current user from the followers list of the users they are unfollowing
            await User.updateMany(
              { _id: { $in: args.followingToRemove } },
              { $pull: { followers: args.user_id } },
            );
          }
          return updatedUser;
        } catch (error) {
          console.log(error);
          throw new Error(`Error editing user: ${error}`);
        }
      },
    },
    addTweet: {
      type: TweetType,
      args: {
        content: { type: new GraphQLNonNull(GraphQLString) },
        authorID: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(_parents, args, { userID }) {
        if (!userID || userID.userID !== args.authorID) {
          console.log("addTweet Request");
          throw new Error(`Unauthorized Request`);
        }
        const tweet = new Tweet({
          content: args.content,
          author: args.authorID,
        });
        try {
          const savedTweet = await tweet.save();
          return savedTweet;
        } catch (error) {
          throw new Error(`Error while creating tweet ${error}`);
        }
      },
    },
    updateTweet: {
      type: TweetType,
      args: {
        tweet_id: { type: new GraphQLNonNull(GraphQLID) },
        content: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(_parents, args, { userID }) {
        console.log("updateTweet Request");
        if (!userID) throw new Error(`Unauthorized Request`);

        try {
          const existingTweet = await Tweet.findById(args.tweet_id);
          if (!existingTweet) throw new Error("Tweet not found!");

          if (existingTweet.author !== userID.userID) {
            console.log("updateTweet Request");
            throw new Error("Unauthorized Request");
          }

          existingTweet.content = args.content;
          return existingTweet.save();
        } catch (error) {
          throw new Error(`Error while editing tweet ${error}`);
        }
      },
    },
    deleteTweet: {
      type: TweetType,
      args: {
        tweet_id: { type: new GraphQLNonNull(GraphQLID) },
      },
      async resolve(_parents, args, { userID }) {
        if (!userID) {
          console.log("deleteTweet Request");
          throw new Error(`Unauthorized Request`);
        }
        try {
          const existingTweet = await Tweet.findById(args.tweet_id);
          if (!existingTweet) throw new Error("Tweet not found!");

          if (existingTweet.author!.toString() !== userID.userID) {
            console.log("deleteTweet Request");
            throw new Error("Unauthorized Request");
          }

          return existingTweet.deleteOne();
        } catch (error) {
          throw new Error(`Error while deleting tweet ${error}`);
        }
      },
    },
  },
});

export default new GraphQLSchema({ query: RootQuery, mutation: Mutation });
