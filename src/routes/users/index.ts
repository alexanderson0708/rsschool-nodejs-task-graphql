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
      const res = await this.db.users.findOne(request.id)
      if(res){
        return res
      }else {
        throw reply.notFound()
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
      return await this.db.users.create(request.body)
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
      const res = await this.db.users.delete(request.id)
      if(res){
        return res
      }else {
        throw reply.notFound()
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
      const res = await this.db.users.findOne(request.id)
      if (res){
        const {subscribedToUserIds} = res
        const {id : subscribeId} = request.params
        if (!subscribedToUserIds.includes(subscribeId)){
          subscribedToUserIds.push(subscribeId)
          return this.db.users.change(request.body.userId, {subscribedToUserIds})
        }else{
          return res
        }
      }else{
        throw reply.notFound()
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
      const res = await this.db.users.findOne(request.id)
      if (res){
        const {subscribedToUserIds} = res
        const {id : unsubscribeId} = request.params
        const index = subscribedToUserIds.findIndex((id)=>id===unsubscribeId)
        if (index!==-1){
          subscribedToUserIds.slice(index,1)
          return this.db.users.change(request.body.userId, {subscribedToUserIds})
        }else{
          throw reply.badRequest()
        }
      }else{
        throw reply.notFound()
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
      const res = await this.db.users.change(request.id, request.body)
      if (!res) throw reply.notFound()
      return res
    }
  );
};

export default plugin;
