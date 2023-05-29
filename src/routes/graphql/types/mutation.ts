import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLString
} from "graphql";
import { FastifyInstance } from "fastify";
import {UserEntity} from "../../../utils/DB/entities/DBUsers";
import {ProfileEntity} from "../../../utils/DB/entities/DBProfiles";
import {PostEntity} from "../../../utils/DB/entities/DBPosts";
import {MemberTypeEntity} from "../../../utils/DB/entities/DBMemberTypes";
import { memberTypePayloadType, memberTypeUpdateType, postCreateType, postPayloadType, postUpdateType, profileCreateType, profilePayloadType, profileUpdateType, subscribeToAndUnsubscribeFromPayloadType, subscribeToPayloadType, unsubscribeFromPayloadType, userCreateType, userPayloadType, userUpdateType } from "./inputTypes";




export const mutationType = new GraphQLObjectType({
  name:'Mutation',
  fields:()=>({
    userCreate:{
      type:userPayloadType,
      args:{
        input:{
          type:userCreateType
        }
      },
      resolve:async (source:unknown, {input}:{input:Omit<UserEntity, 'id'|'subscribedToUserId'>}, {fastify}:{fastify:FastifyInstance}) => ({
        user: await fastify.db.users.create(input)
      }),
    },
    userUpdate:{
      type:userPayloadType,
      args:{
        id:{type:GraphQLID},
        input:{
          type:userUpdateType
        },
      },
      resolve:async (source:unknown, {id, input}:{id:string, input:Partial<Omit<UserEntity, 'id'>>}, {fastify}:{fastify:FastifyInstance}) => {
        const user = await fastify.db.users.findOne({key:'id', equals:id})
        if(!user) throw new Error(`User with id:${id} not found`)
        return {user: await fastify.db.users.change(id, input)}
      },
    },
    profileCreate:{
      type:profilePayloadType,
      args:{
        input:{
          type:profileCreateType
        }
      },
      resolve:async (source:unknown, {input}:{input:Omit<ProfileEntity, 'id'>}, {fastify}:{fastify:FastifyInstance}) => {
        const {userId, memberTypeId} = input

        const user = await fastify.db.users.findOne({key:'id', equals:userId})
        if(!user) throw new Error(`User with userId:${userId} does not exist`)

        const memberType = await fastify.db.memberTypes.findOne({key:'id', equals:memberTypeId})
        if(!memberType) throw new Error(`User with memberType:${memberTypeId} does not exist`)

        const profile = await fastify.db.profiles.findOne({key:'userId', equals:userId})
        if(profile) throw new Error(`User with profile:${userId} has already exist`)

        return {profile:await fastify.db.profiles.create(input)}
      },
    },
    profileUpdate:{
      type:profilePayloadType,
      args:{
        id:{type:GraphQLID},
        input:{
          type:profileUpdateType
        }
      },
      resolve:async (source:unknown, {id, input}:{id:string, input:Partial<Omit<ProfileEntity, 'id'|'userId'>>}, {fastify}:{fastify:FastifyInstance}) => {
        const profile = await fastify.db.profiles.findOne({key:'id', equals:id})
        if(!profile) throw new Error(`Profile with id:${id} not found`)
        return {profile: await fastify.db.profiles.change(id, input)}
      },
    },

    postCreate:{
      type:postPayloadType,
      args: {
        input: {
          type: postCreateType
        },
      },
      resolve:async (source:unknown, {input}:{input:Omit<PostEntity, 'id'>}, {fastify}:{fastify:FastifyInstance}) => {
        const user = await fastify.db.users.findOne({key:'id', equals:input.userId})
        if(!user) throw new Error(`User with userId:${input.userId} not found`)
        return {post: await fastify.db.posts.create(input)}
      },
    },
    postUpdate:{
      type:postPayloadType,
      args:{
        id:{type:GraphQLID},
        input: {
          type: postUpdateType
        },
      },
      resolve:async (source:unknown, {id, input}:{id:string, input:Partial<Omit<PostEntity, 'id'|'userId'>>}, {fastify}:{fastify:FastifyInstance}) => {
        const post = await fastify.db.posts.findOne({key:'id', equals:id})
        if(!post) throw new Error(`Post with Id:${id} not found`)
        return {post: await fastify.db.posts.change(id, input)}
      },
    },
    memberTypeUpdate:{
      type:memberTypePayloadType,
      args: {
        id:{type:GraphQLString},
        input: {
          type: memberTypeUpdateType
        },
      },
      resolve:async (source:unknown, {id, input}:{id:string, input:Partial<Omit<MemberTypeEntity, 'id'>>}, {fastify}:{fastify:FastifyInstance}) => {
        const memberType = await fastify.db.memberTypes.findOne({key:'id', equals:id})
        if(!memberType) throw new Error(`MemberType with id:${id} not found`)
        return {memberType: await fastify.db.memberTypes.change(id, input)}
      },
    },
    subscribeTo:{
      type:subscribeToPayloadType,
      args:{
        id:{type:GraphQLID},
        input: {
          type: subscribeToAndUnsubscribeFromPayloadType
        },
      },
      resolve:async (source:unknown, {id, input}:{id:string, input:{userId:string}}, {fastify}:{fastify:FastifyInstance}) => {
        const subscribeToUser = await fastify.db.users.findOne({key:'id', equals:input.userId})
        const subscriber = await fastify.db.users.findOne({key:'id', equals:id})

        if(!subscribeToUser) throw new Error(`User for subscribe with userId:${input.userId} does not exist`)
        if(!subscriber) throw new Error(`Subscribing user with id:${id} does not exist`)
        if(subscribeToUser.subscribedToUserIds.includes(id)) throw new Error(`User with id:${id} has already subscribed`)

        subscribeToUser.subscribedToUserIds.push(id)

        return {subscribeTo: await fastify.db.users.change(input.userId, subscribeToUser)}
      },
    },
    unsubscribeFrom:{
      type:unsubscribeFromPayloadType,
      args:{
        id:{type:GraphQLID},
        input: {
          type: subscribeToAndUnsubscribeFromPayloadType
        },
      },
      resolve:async (source:unknown, {id, input}:{id:string, input:{userId:string}}, {fastify}:{fastify:FastifyInstance}) => {
        const unSubscribeFromUser = await fastify.db.users.findOne({key:'id', equals:input.userId})
        const unsubscriber = await fastify.db.users.findOne({key:'id', equals:id})

        if(!unSubscribeFromUser) throw new Error(`User for unsubscribe with userId:${input.userId} does not exist`)
        if(!unsubscriber) throw new Error(`Unsubscribing user with id:${id} does not exist`)
        const idx = unSubscribeFromUser.subscribedToUserIds.indexOf(id)
        if(idx===-1) throw new Error(`User with id:${id} has already unsubscribed`)

        unSubscribeFromUser.subscribedToUserIds.splice(idx,1)

        return {unSubscribeFrom: await fastify.db.users.change(input.userId, unSubscribeFromUser)}
      },
    },
  })
})


