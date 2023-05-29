import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema } from './schema';
import { GraphQLSchema, graphql, validate, parse} from 'graphql';
import { queryType } from './types/query';
import {mutationType} from "./types/mutation";
import * as depthLimit from "graphql-depth-limit";
import { createDataLoader } from './data-loader';


const DEFAULT_DEPTH_LIMIT = 6

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  fastify.post('/',
  {
    schema: {
      body: graphqlBodySchema,
    },
  },
    async function name(request, reply) {
      const {body: gqlRequest} = request
      if(gqlRequest.query || gqlRequest.mutation){
        return await graphql({
          schema:new GraphQLSchema({
            query:queryType,
            mutation:mutationType,
          }),
          source:(gqlRequest.query! || gqlRequest.mutation!),
          contextValue:{
            fastify,
            validationDepth: validate(
              new GraphQLSchema({query:queryType, mutation:mutationType}), 
              parse((gqlRequest.query||gqlRequest.mutation)!), 
            [
              depthLimit(DEFAULT_DEPTH_LIMIT),
            ]),
            dataLoader:createDataLoader(fastify)
          },
          variableValues: gqlRequest.variables
        })
      }
      
    }
  )}
export default plugin;
