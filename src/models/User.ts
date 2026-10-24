// Dependencies
import { Schema, model } from 'mongoose'

export class Template {
  name: string
  text: string
}

export class User {
  id: number
  templates: Template[]
  language: string
  hidePreview: boolean
}

const templateSchema = new Schema<Template>({
  name: { type: String, required: true, index: true },
  text: { type: String, required: true },
})

const userSchema = new Schema<User>(
  {
    id: { type: Number, required: true, index: true, unique: true },
    templates: { type: [templateSchema], default: [] },
    language: { type: String, required: true, default: 'en' },
    hidePreview: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
)

// Get User model
const UserModel = model<User>('User', userSchema)

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
