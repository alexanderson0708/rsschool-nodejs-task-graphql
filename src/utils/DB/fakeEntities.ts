import { faker } from "@faker-js/faker"
import DBUsers from "./entities/DBUsers"
import DBPosts from "./entities/DBPosts"
import DBProfiles from "./entities/DBProfiles"
import DBMemberTypes from "./entities/DBMemberTypes"

export const fakeCreateUserDTO = () => ({
  firstName: faker.name.firstName(),
  lastName:faker.name.lastName(),
  email:faker.internet.email()
})


export const fakeCreateProfileDTO = (userId:string, memberTypeId:string) => ({
  avatar: faker.image.avatar(),
  sex: faker.name.sexType(),
  birthday: faker.date.birthdate().getTime(),
  country: faker.address.country(),
  street: faker.address.street(),
  city: faker.address.city(),
  memberTypeId,
  userId,
})


export const fakeCreatePostDTO = (userId:string) => ({
  title: faker.lorem.sentence(),
  content:faker.lorem.sentences(10),
  userId,
})

export const fakeCreateMemberTypeDTO = (memberType:string) => ({
  discount: memberType==='basic' ? 0 : 20,
  monthPostsLimit:memberType==='basic' ? 2 : 5,
})

export const createFakeEntities = async (
  user:DBUsers,
  post:DBPosts,
  profiles:DBProfiles,
  memberType:DBMemberTypes
  ):Promise<void> => {
    const NUMBER_OF_USERS = 5
  
    
    for (let index = 0; index < NUMBER_OF_USERS; index++) {
      const basicOrBusiness = () => Math.random() < 0.5 ? 'basic' : 'business'
      // const NUMBER_OF_POST:number = basicOrBusiness() ==='basic' ? 0 : 20,

      const element = await user.create(fakeCreateUserDTO())

      const profile = await profiles.create(fakeCreateProfileDTO(element.id, basicOrBusiness()))
      
      const NUMBER_OF_POST = profile.memberTypeId === 'basic' ? 2 : 5

      for (let i = 0; i < NUMBER_OF_POST; i++) {
        await post.create(fakeCreatePostDTO(element.id)); 
      }
      

    }
}