import { GraphQLID, GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";
import { memberType, postType, profileType, userType } from "./basic";
import { FastifyInstance } from "fastify";



export const queryType = new GraphQLObjectType({
  name:'Query',
  fields:()=>({
    users:{
      type: new GraphQLList(userType),
      resolve:async (source:unknown, args:unknown, {fastify}:{fastify:FastifyInstance}) => {
        return await fastify.db.users.findMany()
      },
    },
    posts:{
      type: new GraphQLList(postType),
      resolve:async (source:unknown, args:unknown, {fastify}:{fastify:FastifyInstance}) => {
        return await fastify.db.posts.findMany()
      },
    },
    profiles:{
      type: new GraphQLList(profileType),
      resolve:async (source:unknown, args:unknown, {fastify}:{fastify:FastifyInstance}) => {
        return await fastify.db.profiles.findMany()
      },
    },
    memberTypes:{
      type: new GraphQLList(memberType),
      resolve:async (source:unknown, args:unknown, {fastify}:{fastify:FastifyInstance}) => {
        return await fastify.db.memberTypes.findMany()
      },
    },

    user:{
      type:userType,
      args:{id:{type:GraphQLID}},
      resolve:async (source:unknown, {id}:{[key:string]:string}, {fastify}:{fastify:FastifyInstance}) => {
        return await fastify.db.users.findOne({key:'id', equals:id}).catch(()=> new Error(`User with id:${id} not found`))
      }
    },
    post:{
      type:postType,
      args:{id:{type:GraphQLID}},
      resolve:async (source:unknown, {id}:{[key:string]:string}, {fastify}:{fastify:FastifyInstance}) => {
        return await fastify.db.posts.findOne({key:'id', equals:id}).catch(()=> new Error(`Post with id:${id} not found`))
      }
    },
    profile:{
      type:profileType,
      args:{id:{type:GraphQLID}},
      resolve:async (source:unknown, {id}:{[key:string]:string}, {fastify}:{fastify:FastifyInstance}) => {
        return await fastify.db.profiles.findOne({key:'id', equals:id}).catch(()=> new Error(`Profile with id:${id} not found`))
      }
    },
    memberType:{
      type:memberType,
      args:{id:{type:GraphQLString}},
      resolve:async (source:unknown, {id}:{[key:string]:string}, {fastify}:{fastify:FastifyInstance}) => {
        return await fastify.db.memberTypes.findOne({key:'id', equals:id}).catch(()=> new Error(`MemberType with id:${id} not found`))
      }
    },
  })
})