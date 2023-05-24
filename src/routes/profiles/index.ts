import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';


const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<ProfileEntity[]> {
    return await this.db.profiles.findMany()
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const res = await this.db.profiles.findOne({key:"id", equals:request.params.id})
      
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
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      try {
        const memberType = await this.db.memberTypes.findOne({key:"id", equals:request.body.memberTypeId}) 
        const user = await this.db.users.findOne({key:"id", equals:request.body.memberTypeId}) 
        const profile = await this.db.profiles.findOne({key:"id", equals:request.body.memberTypeId})
        
        if(!user) throw new Error ('User does not exist')
        if(!memberType) throw new Error ('MemberType does not exist')
        if(profile) throw new Error ('This profile already exist')
        
        return await fastify.db.profiles.create(request.body)
      }
      catch(e){
        return reply.code(400).send({message:(e as Error).message || "Bad Request"})
      }
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      return await this.db.profiles.delete(request.params.id).catch(()=>{
        return reply.code(400).send({message:'Bad Request'})
      })
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      try {
        const {id} = request.params
        const partialParam = request.body
        if (partialParam.memberTypeId){
          const memberType = await fastify.db.memberTypes.findOne({key:'id', equals:partialParam.memberTypeId})

          if(!memberType) throw new Error ('MemberType does not exist');

        }
        return await fastify.db.profiles.change(id, partialParam);
      } catch (error) {
        return reply.code(400).send({message:(error as Error).message || "Bad Request"})
      }
    }
  );
};

export default plugin;
