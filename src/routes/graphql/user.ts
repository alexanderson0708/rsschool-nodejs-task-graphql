import * as dataloader from "dataloader"
import { FastifyInstance } from "fastify"

export const createDataLoaderd = async (fastify:FastifyInstance) => {
  const  getPostsByUserId = async (ids:any) => {
    const posts = await fastify.db.posts.findMany({
      key:'userId',
      equalsAnyOf:ids
    })
    return ids.map((id:string)=>posts.filter((post)=>post.userId === id))
  }
  
  const  getProfileByUserId = async (ids:any) => {
    const profile = await fastify.db.profiles.findMany({
      key:'userId',
      equalsAnyOf:ids
    })
    return ids.map((id:string) => profile.find((profile) => profile.userId === id)||null)
  }

  const  getMemberTypesByUserId = async (ids:any) => {
    const memberType = await fastify.db.memberTypes.findMany({
      key:'id',
      equalsAnyOf:ids
    })
    return ids.map((id:string)=>memberType.filter((memberType)=>memberType.id === id)||null)
  }

  const postsDataLoader = new dataloader(getPostsByUserId)
  const profileDataLoader = new dataloader(getProfileByUserId)
  const memberTypeDataLoader = new dataloader(getMemberTypesByUserId)

  return {postsDataLoader, profileDataLoader, memberTypeDataLoader}
}

