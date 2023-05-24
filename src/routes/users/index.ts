import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
// import * as repl from "repl";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return await this.db.users.findMany()
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const res = await this.db.users.findOne({key:"id", equals:request.params.id})
      if(res){
        return res
      }else {
        return reply.code(404).send({message:'Not found'})
      }
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      return await fastify.db.users.create(request.body).catch((e:Error)=>{
        return reply.code(400).send({message:e.message || "Bad Request"})
      })
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      try {
        const {id} = request.params
        const deleteUser = await fastify.db.users.delete(id)
        const relatedUsers = await fastify.db.users.findMany({key:'subscribedToUserIds', inArray:id})
        const relatedPosts = await fastify.db.posts.findMany({key:'userId', equals:id})
        const relatedProfiles = await fastify.db.profiles.findMany({key:'userId', equals:id})

        for (let user of relatedUsers){
          const index = user.subscribedToUserIds.findIndex((i)=>i === id)
          const newArrUsers = [...user.subscribedToUserIds].splice(index,1)
          await fastify.db.users.change(user.id, {subscribedToUserIds:[...newArrUsers]})
        }

        for (let post of relatedPosts){
          await fastify.db.posts.delete(post.id)
        }

        for (let profile of relatedProfiles){
          await fastify.db.profiles.delete(profile.id)
        }
      
      return deleteUser
      } catch (err) {
        return reply.code(400).send({message:(err as Error)||'Invalid user ids'})
      }
      

    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      try{
        const subscriber = await this.db.users.findOne({key:"id", equals:request.params.id})
        const user = await this.db.users.findOne({key:"id", equals:request.body.userId})
        if (subscriber && user){
          if (user.subscribedToUserIds.includes(request.params.id)) throw new Error('User already subscribed')
          if (request.params.id === request.body.userId) throw new Error('Error:You can not subscribe to yourself')
  
          return await fastify.db.users.change(request.body.userId, {subscribedToUserIds:[...user.subscribedToUserIds, request.params.id]})
        }else{
          throw new Error()
        }
      }catch(err){
        return reply.code(400).send({message:(err as Error)||'Invalid user ids'})
      }
     
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      try{
        const subscriber = await this.db.users.findOne({key:"id", equals:request.params.id})
        const user = await this.db.users.findOne({key:"id", equals:request.body.userId})
        if (subscriber && user){
          if (!user.subscribedToUserIds.includes(request.params.id)) throw new Error('Not found subscribers')

          const index = user.subscribedToUserIds.findIndex((i)=>i === request.params.id)
          const newArrSubscribers = [...user.subscribedToUserIds].splice(index,1)

          return await fastify.db.users.change(request.body.userId, {subscribedToUserIds:[...newArrSubscribers]})
        }else{
          throw new Error()
        }
      }catch(err){
        return reply.code(400).send({message:'Bad Request'})
      }
     
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      return fastify.db.users.change(request.params.id, request.body).catch((e:Error)=>{
        return reply.code(400).send({message:e.message || "Bad Request"})
      })
    }
  );
};

export default plugin;
