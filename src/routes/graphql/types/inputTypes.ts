import { GraphQLFloat, GraphQLID, GraphQLInputObjectType, GraphQLInt, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { memberType, postType, profileType, userType } from "./basic"

export const userPayloadType = new GraphQLObjectType({
  name:'UserPayload',
  fields:()=>({
    user:{type:userType},
  }),
})

export const userCreateType = new GraphQLInputObjectType({
  name:'UserCreateType',
  fields:()=>({
    firstName:{type: new GraphQLNonNull(GraphQLString)},
    lastName:{type: new GraphQLNonNull(GraphQLString)},
    email:{type: new GraphQLNonNull(GraphQLString)}
  }),
})

export const userUpdateType = new GraphQLInputObjectType({
  name:'UserUpdateType',
  fields:()=>({
    firstName:{type: GraphQLString},
    lastName:{type: GraphQLString},
    email:{type: GraphQLString}
  }),
})

export const subscribeToPayloadType = new GraphQLObjectType({
  name:'SubscribeToPayload',
  fields:()=>({
    subscribeTo:{type:userType},
  }),
})

export const unsubscribeFromPayloadType = new GraphQLObjectType({
  name:'UnsubscribeFromPayload',
  fields:()=>({
    unsubscribeFrom:{type:userType},
  }),
})


export const subscribeToAndUnsubscribeFromPayloadType = new GraphQLInputObjectType({
  name:'SubscribeToAndUnsubscribeFromPayload',
  fields:()=>({
    userId:{type:new GraphQLNonNull(GraphQLID)},
  }),
})

export const postPayloadType = new GraphQLObjectType({
  name:'PostPayload',
  fields:()=>({
    post:{type:postType},
  }),
})

export const postCreateType = new GraphQLInputObjectType({
  name:'PostCreateType',
  fields:()=>({
    title:{type: new GraphQLNonNull(GraphQLString)},
    content:{type: new GraphQLNonNull(GraphQLString)},
    userId:{type: new GraphQLNonNull(GraphQLID)}
  }),
})

export const postUpdateType = new GraphQLInputObjectType({
  name:'PostUpdateType',
  fields:()=>({
    title:{type: GraphQLString},
    content:{type: GraphQLString}
  }),
})

export const profilePayloadType = new GraphQLObjectType({
  name:'ProfilePayload',
  fields:()=>({
    profile:{type:profileType},
  }),
})

export const profileCreateType = new GraphQLInputObjectType({
  name:'ProfileCreateType',
  fields:()=>({
    avatar:{type: new GraphQLNonNull(GraphQLString)},
    sex:{type: new GraphQLNonNull(GraphQLString)},
    birthday:{type: new GraphQLNonNull(GraphQLFloat)},
    country:{type: new GraphQLNonNull(GraphQLString)},
    street:{type: new GraphQLNonNull(GraphQLString)},
    city:{type: new GraphQLNonNull(GraphQLString)},
    userId:{type: new GraphQLNonNull(GraphQLID)},
    memberTypeId:{type: new GraphQLNonNull(GraphQLString)},
  }),
})

export const profileUpdateType = new GraphQLInputObjectType({
  name:'ProfileUpdateType',
  fields:()=>({
    avatar:{type: GraphQLString},
    sex:{type: GraphQLString},
    birthday:{type: GraphQLFloat},
    country:{type: GraphQLString},
    street:{type: GraphQLString},
    city:{type: GraphQLString},
    memberTypeId:{type: GraphQLString},
  }),
})

export const memberTypePayloadType = new GraphQLObjectType({
  name:'MemberTypePayload',
  fields:()=>({
    memberType:{type:memberType},
  }),
})


export const memberTypeUpdateType = new GraphQLInputObjectType({
  name:'MemberTypeUpdateType',
  fields:()=>({
    discount:{type: GraphQLInt},
    monthPostsLimit:{type: GraphQLInt},
  }),
})