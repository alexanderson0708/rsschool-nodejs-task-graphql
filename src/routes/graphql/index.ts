import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema } from './schema';
import { createDataLoader } from './user';
import { GraphQLSchema, graphql } from 'graphql';
import { queryType } from './types/query';
import {mutationType} from "./types/mutation";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  const {postsDataLoader, profilesDataLoader, memberTypesDataLoader} = await createDataLoader(fastify)  
  fastify.post('/',
  {
    schema: {
      body: graphqlBodySchema,
    },
  },
    async function name(request, reply) {
      const {body:{query, variables}} = request
      return await graphql({
        schema:new GraphQLSchema({
          query:queryType,
          mutation:mutationType,
        }),
        source:query!,
        contextValue:{
          fastify,
          postsDataLoader,
          profilesDataLoader,
          memberTypesDataLoader
        },
        variableValues: variables
      })
    }
  )}
export default plugin;
