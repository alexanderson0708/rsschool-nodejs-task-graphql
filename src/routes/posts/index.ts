import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    return await this.db.posts.findMany()
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const res = await this.db.posts.findOne({key:"id", equals:request.params.id})
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
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      return fastify.db.posts.create(request.body).catch((e:Error)=>{
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
    async function (request, reply): Promise<PostEntity> {
      return this.db.posts.delete(request.params.id).catch(()=>{
        return reply.code(400).send({message:'Bad Request'})
      })
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      return fastify.db.posts.change(request.params.id, request.body).catch((e:Error)=>{
        return reply.code(400).send({message:e.message || "Bad Request"})
      })
    }
  );
};

export default plugin;
