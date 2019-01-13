// Dependencies
import { prop, Typegoose, arrayProp } from 'typegoose'

export class Template {
  @prop({ required: true, index: true })
  name: string
  @prop({ required: true })
  text: string
}

export class User extends Typegoose {
  @prop({ required: true, index: true, unique: true })
  id: number
  @arrayProp({ items: Template, default: [] })
  templates: Template[]

  @prop({ required: true, default: 'en' })
  language: string
}

// Get User model
const UserModel = new User().getModelForClass(User, {
  schemaOptions: { timestamps: true },
})

// Get or create user
export async function findUser(id: number) {
  let user = await UserModel.findOne({ id })
  if (!user) {
    try {
      user = await new UserModel({ id }).save()
    } catch (err) {
      user = await UserModel.findOne({ id })
    }
  }
  return user
}
