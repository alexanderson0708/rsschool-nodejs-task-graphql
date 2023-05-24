import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import {checkIsValidUUID} from "../profiles";
import {filter, includes, keyBy} from "lodash";
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
      const res = await this.db.users.findOne({key:"id", equalsAnyOf:[request.params.id]})
      if(res){
        return res
      }else {
        throw fastify.httpErrors.notFound()
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

        if(!checkIsValidUUID(id)) throw fastify.httpErrors.badRequest()

        const relatedUsers = await fastify.db.users.findMany({key:'subscribedToUserIds', inArray:id})
        for (let user of relatedUsers){
          const subscribedToUserIds = filter(user.subscribedToUserIds,(userId) => userId !== id)
          await fastify.db.users.change(user.id, {subscribedToUserIds})
        }

        const relatedPosts = await fastify.db.posts.findMany({key:'userId', equals:id})
        for (let post of relatedPosts){
          await fastify.db.posts.delete(post.id)
        }

        const relatedProfiles = await fastify.db.profiles.findMany({key:'userId', equals:id})
        for (let profile of relatedProfiles){
          await fastify.db.profiles.delete(profile.id)
        }

        return await fastify.db.users.delete(id)
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
      const id = request.params.id
      const subscribeToUserId = request.body.userId

      if(!checkIsValidUUID(id)||!checkIsValidUUID(subscribeToUserId)) throw fastify.httpErrors.badRequest()

      const users = keyBy(await fastify.db.users.findMany({key:"id", equalsAnyOf: [id, subscribeToUserId]}), id)

      if( !users[id] || !users[subscribeToUserId] ) throw fastify.httpErrors.notFound()

      if( includes(users[subscribeToUserId].subscribedToUserIds, id)) throw fastify.httpErrors.badRequest()

      const subscribedToUserIds = [...users[subscribeToUserId].subscribedToUserIds, id]
      await fastify.db.users.change(subscribeToUserId, {subscribedToUserIds})
      return users[id]
     
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
