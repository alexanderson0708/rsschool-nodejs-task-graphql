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

type context = {
  fastify:FastifyInstance;
  postDataLoader: dataloader<unknown, unknown, unknown>;
  profileDataLoader: dataloader<unknown, unknown, unknown>;
  memberTypeDataLoader: dataloader<unknown, unknown, unknown>;
}



export const memberType = new GraphQLObjectType({
  name:'MemberType',
  fields:{
    id:{ type: new GraphQLNonNull(GraphQLID) },
    discounts:{ type: new GraphQLNonNull(GraphQLString) },
    monthPostsLimits:{ type: new GraphQLNonNull(GraphQLInt) },
  }
})

export const postType = new GraphQLObjectType({
  name:'Post',
  fields:{
    id:{ type: new GraphQLNonNull(GraphQLID) },
    title:{ type: new GraphQLNonNull(GraphQLString) },
    content:{ type: new GraphQLNonNull(GraphQLString) },
    userId:{type: new GraphQLNonNull(GraphQLID)}
  }
})

export const profileType = new GraphQLObjectType({
  name:'Profile',
  fields:{
    id:{ type: new GraphQLNonNull(GraphQLID) },
    avatar: { type: new GraphQLNonNull(GraphQLString) },
    sex: { type: new GraphQLNonNull(GraphQLString) },
    birthday: { type: new GraphQLNonNull(GraphQLString) },
    country: { type: new GraphQLNonNull(GraphQLString) },
    street: { type: new GraphQLNonNull(GraphQLString) },
    city: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: new GraphQLNonNull(GraphQLID) },
    memberTypeId: {type: new GraphQLNonNull(GraphQLString)},
  }
})

export const userType:GraphQLObjectType<any, any> = new GraphQLObjectType({
  name:'User',
  fields: () => ({
    id:{ type: new GraphQLNonNull(GraphQLID) },
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    cousubscribedToUserIdsntry: { type: new GraphQLNonNull(new GraphQLList(GraphQLString))},
    posts:{
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(postType))),
      resolve:async (source:UserEntity, args:unknown, context:context) => {
        return await context.postDataLoader.load(source.id)
      },
    },
    profiles:{
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(profileType))),
      resolve:async (source:UserEntity, args:unknown, context:context) => {
        return await context.profileDataLoader.load(source.id).catch(()=> new Error(`Profile id:${source.id} not found`))
      },
    },
    memberType: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(memberType))),
      resolve:async (source:UserEntity, args:unknown, context:context) => {
        const {profileDataLoader, memberTypeDataLoader} = context
        const {id} = source
        const profile = await profileDataLoader.load(id)
        const memberType = await memberTypeDataLoader.load(id)

        if(!profile) throw new Error (`Profile with id:${id} not found`)
        if(!memberType) throw new Error (`MemberType with id:${id} not found`)

        return memberType
      },
    },
    userSubscribedTo:{
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userType))),
      resolve:async (source:UserEntity, args:unknown, context:context) => {
        return await context.fastify.db.users.findMany({key:'subscribedToUserIds', inArray:source.id })
      },
    },
    subscribedToUser:{
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userType))),
      resolve:async (source:UserEntity, args:unknown, context:context) => {
        return await context.fastify.db.users.findMany({key:'id', equalsAnyOf:source.subscribedToUserIds })
      },
    },
  })
})