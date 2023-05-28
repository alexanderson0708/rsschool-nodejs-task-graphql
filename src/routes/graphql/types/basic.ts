import  { FastifyInstance } from 'fastify';
import { 
  GraphQLNonNull, 
  GraphQLObjectType, 
  GraphQLID, 
  GraphQLString, 
  GraphQLInt,
  GraphQLList, 
} from 'graphql';
import * as dataloader from 'dataloader'
import { UserEntity } from '../../../utils/DB/entities/DBUsers';
import { ProfileEntity } from '../../../utils/DB/entities/DBProfiles';

type context = {
  fastify:FastifyInstance;
  postsDataLoader: dataloader<unknown, unknown, unknown>;
  profilesDataLoader: dataloader<unknown, unknown, unknown>;
  memberTypesDataLoader: dataloader<unknown, unknown, unknown>;
}



export const memberType = new GraphQLObjectType({
  name:'MemberType',
  fields:()=>({
    id:{ type: GraphQLString },
    discount:{ type: GraphQLInt },
    monthPostsLimit:{ type: GraphQLInt },
  })
})

export const postType = new GraphQLObjectType({
  name:'Post',
  fields:()=>({
    id:{ type: new GraphQLNonNull(GraphQLID) },
    title:{ type: GraphQLString },
    content:{ type: GraphQLString },
    userId:{type: new GraphQLNonNull(GraphQLID)}
  })
})

export const profileType = new GraphQLObjectType({
  name:'Profile',
  fields:()=>({
    id:{ type: new GraphQLNonNull(GraphQLID) },
    avatar: { type: GraphQLString },
    sex: { type: GraphQLString },
    birthday: { type: GraphQLString },
    country: { type: GraphQLString },
    street: { type: GraphQLString },
    city: { type: GraphQLString },
    memberTypeId: {type: GraphQLString},
    userId: { type: new GraphQLNonNull(GraphQLID) },
  })
})

export const userType:GraphQLObjectType<any, any> = new GraphQLObjectType({
  name:'User',
  fields: () => ({
    id:{ type: new GraphQLNonNull(GraphQLID) },
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: GraphQLString },
    email: { type: new GraphQLNonNull(GraphQLString) },
    subscribedToUserIds: { type: new GraphQLList(GraphQLID)},
    posts:{
      type: new GraphQLList(postType),
      resolve:async (source:UserEntity, args:unknown, context:context) => {
        return await context.postsDataLoader.load(source.id)
      },
    },
    profiles:{
      type: profileType,
      resolve:async (source:UserEntity, args:unknown, context:context) => {
        const profile = await context.profilesDataLoader.load(source.id)
        if(!profile) throw new Error(`Profile id:${source.id} not found`)
        console.log(profile)
        return profile
      },
    },
    memberType: {
      type: memberType,
      resolve:async (source:UserEntity, args:unknown, context:context) => {
        const {profilesDataLoader, memberTypesDataLoader} = context

        const {id} = source
        const userProfile = await profilesDataLoader.load(id) as [ProfileEntity]

        console.log(userProfile)
        // const {memberTypeId} = userProfile

        if(!userProfile) throw new Error (`Profile with id:${id} not found`)
        
        const memberType = await memberTypesDataLoader.load(userProfile[0].memberTypeId)
        
        return memberType
      },
    },
    userSubscribedTo:{
      type: new GraphQLList(userType),
      resolve:async (source:UserEntity, args:unknown, context:context) => {
        return await context.fastify.db.users.findMany({key:'subscribedToUserIds', inArray:source.id })
      },
    },
    subscribedToUser:{
      type: new GraphQLList(userType),
      resolve:async (source:UserEntity, args:unknown, context:context) => {
        return await context.fastify.db.users.findMany({key:'id', equalsAnyOf:source.subscribedToUserIds })
      },
    },
  })
})