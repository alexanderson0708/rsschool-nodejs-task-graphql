import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import {checkIsValidUUID} from "../profiles";
import {filter} from "lodash";
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
      const {id} = request.params
      const res = await this.db.users.findOne({key:"id", equals:id})
      if(res){
        return res
      }else {
        return reply.code(404).send({message:'Not Found'})
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
      return fastify.db.users.create(request.body as Omit<UserEntity, 'id' | 'subscribedToUserIds'>);
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
        const {id} = request.params as {id:string}

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
      try {
        const { id: subscriberId } = request.params as { id: string };
        const { userId } = request.body as { userId: string };

        const subscriberUser = await fastify.db.users.findOne({ key: 'id', equals: subscriberId });
        const user = await fastify.db.users.findOne({ key: 'id', equals: userId });

        if (subscriberUser && user) {
          if (user.subscribedToUserIds.includes(subscriberId)) throw new Error(`User already subscribed.`);
          if (subscriberId === userId) throw new Error(`You can't subscribe to yourself.`);

          const changedUser = await fastify.db.users.change(userId, {
            subscribedToUserIds: [...user.subscribedToUserIds, subscriberId],
          });

          return changedUser;
        } else {
          throw new Error();
        }
      } catch (error) {
        return reply.code(400).send({ message: (error as Error).message || 'Invalid user ids.' });
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
      try {
        const { id: subscriberId } = request.params as { id: string };
        const { userId } = request.body as { userId: string };
        const subscriberUser = await fastify.db.users.findOne({ key: 'id', equals: subscriberId });
        const user = await fastify.db.users.findOne({ key: 'id', equals: userId });

        if (subscriberUser && user) {
          if (!user.subscribedToUserIds.includes(subscriberId)) throw new Error('Not found subscriber for unsubscribe from follow.');

          const copyIds = [...user.subscribedToUserIds];
          const index = user.subscribedToUserIds.findIndex((item) => item === subscriberId);
          copyIds.splice(index, 1);

          const changedUser = await fastify.db.users.change(userId, { subscribedToUserIds: [...copyIds] });

          return changedUser;
        } else {
          throw new Error();
        }
      } catch (error) {
        return reply.code(400).send({ message: (error as Error).message || 'Invalid user ids.' });
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
