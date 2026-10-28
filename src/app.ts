// Config dotenv
import * as dotenv from 'dotenv'
dotenv.config({ path: `${__dirname}/../.env` })
// Dependencies
import { bot } from './helpers/bot'
import { checkTime } from './middlewares/checkTime'
import { setupHelp } from './commands/help'
import { setupI18N } from './helpers/i18n'
import { setupLanguage } from './commands/language'
import { attachUser } from './middlewares/attachUser'
import { setupNewtemplate } from './commands/newtemplate'
import { setupInline } from './helpers/inline'
import { setupDeletetemplate } from './commands/deletetemplate'
import { setupPreview } from './commands/preview'
import { setupAppendtemplate } from './commands/appendtemplate'
import { pollWithHandover } from './helpers/handover'
import { promo } from './helpers/promoHook'

// The newest update fetched and the handlers still running, for handing polling over on deploys
let lastUpdate = 0
let handling = 0
let stopping = false
bot.use(async (ctx, next) => {
  lastUpdate = Math.max(lastUpdate, ctx.update.update_id)
  handling++
  try {
    await next()
  } finally {
    handling--
  }
})
// my_chat_member (the bot blocked or unblocked): Telegraf 3 gives it no ctx.from, so it stops here,
// before attachUser. A private chat blocking the bot counts as harm in promo experiments
bot.use((ctx, next) => {
  const update = (ctx.update as any).my_chat_member
  if (!update) return next()
  if (update.chat.type === 'private' && update.new_chat_member.status === 'kicked')
    promo.blocked(update.from.id)
})
// Check time
bot.use(checkTime)
// Attach user
bot.use(attachUser)
// Setup localization
setupI18N(bot)
// Setup inline
setupInline(bot)
// Setup commands
setupHelp(bot)
setupLanguage(bot)
setupNewtemplate(bot)
setupAppendtemplate(bot)
setupDeletetemplate(bot)
setupPreview(bot)

// Errors
bot.catch(console.error)

// Promo experiments: config every 5 minutes, events every minute (off without PROMO_TOKEN)
promo.start()

// Start bot
pollWithHandover(
  () => {
    // Telegraf 3 stops polling for good on 401/409 from getUpdates and the process
    // then idles. Exit 1 instead, so the bot gets restarted
    // (the typings omit the stopCallback argument)
    // my_chat_member listed explicitly: blocks are the promo experiments' harm metric
    const updates = ['message', 'callback_query', 'inline_query', 'my_chat_member']
    ;(bot as any).startPolling(30, 100, updates, () => {
      if (stopping) return
      console.error('Polling stopped, exiting so the bot gets restarted')
      process.exit(1)
    })
    console.info('Bot is up and running')
  },
  async () => {
    stopping = true
    bot.stop()
    // Telegraf 3 cannot abort its long poll: a zero-timeout getUpdates ends it
    // and confirms every update fetched, so the next poller does not get them again
    await (bot.telegram as any).getUpdates(0, 1, lastUpdate + 1, undefined)
  },
  async () => {
    while (handling) await new Promise((resolve) => setTimeout(resolve, 100))
    await promo.stop()
  }
)
