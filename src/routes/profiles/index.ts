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
      const res = await fastify.db.profiles.findOne({key:'id', equals:request.params.id})
      
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
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      try {
        const {userId, memberTypeId} = request.body
        const memberType = await this.db.memberTypes.findOne({key:"id", equals:memberTypeId})
        const user = await this.db.users.findOne({key:"id", equals:userId})
        const profile = await this.db.profiles.findOne({key:"userId", equals:userId})
        
        if(!user || !memberType || profile) throw fastify.httpErrors.badRequest()
        
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
      if (!checkIsValidUUID(request.params.id)){
        throw fastify.httpErrors.badRequest()
      }
      return await this.db.profiles.change(request.params.id, request.body)
      try {
        const {id} = request.params
        const partialParam = request.body
        if (id){
          const memberType = await fastify.db.memberTypes.findOne({key:'id', equals:id})
          if(!memberType) throw new Error ('MemberType does not exist');
        }
        const updateProfile = await this.db.profiles.change(id, partialParam)
        return updateProfile
      } catch (error) {
        return reply.code(400).send({message:(error as Error).message || "Bad Request"})
      }
    }
  );
};

export default plugin;


export function checkIsValidUUID(str: string) {
  const regexExp =
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
  return regexExp.test(str);
}