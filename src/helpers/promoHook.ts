// Temply's reply-promo hook (promo.ts, Prime Radiant's experiments): one per process
import * as mongoose from 'mongoose'
import { ContextMessageUpdate } from 'telegraf'
import { mongoStore, promos } from './promo'

export const promo = promos('temply', mongoStore(mongoose.connection.collection('promos') as any))

// The language the user reads Temply in, as an ISO code (Temply says ua and kz)
export const promoLang = (ctx: ContextMessageUpdate) => {
  const l = ctx.dbuser.language || ctx.from.language_code
  return ({ ua: 'uk', kz: 'kk' } as Record<string, string>)[l] || l
}
