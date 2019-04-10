// Dependencies
import { Telegraf, ContextMessageUpdate, Extra } from 'telegraf'
import { Template } from '../models'
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types'

export function setupAppendtemplate(bot: Telegraf<ContextMessageUpdate>) {
  bot.command(['appendtemplate'], ctx => {
    ctx.replyWithHTML(ctx.i18n.t('appendtemplate'))
  })

  // Detect replies
  bot.use(async (ctx, next) => {
    if (
      !ctx.message ||
      !ctx.message.text ||
      !ctx.message.reply_to_message ||
      !ctx.message.reply_to_message.from.username ||
      ctx.message.reply_to_message.from.username !== bot.options.username ||
      !ctx.message.reply_to_message.text ||
      !ctx.message.reply_to_message.text.includes('👍') ||
      ctx.message.text.split(': ').length < 2
    ) {
      return next()
    }
    let name = ctx.message.text.split(': ')[0]
    if (name.length > 60) {
      name = `${name.substring(0, 57)}...`
    }
    const textArray = ctx.message.text.split(': ')
    textArray.shift()
    const text = textArray.join(': ')
    
    for (const template of ctx.dbuser.templates) {
      if (template.name === name) {
        template.text = `${template.text}${text}`
        try {
          await ctx.replyWithHTML(template.text)
          await (ctx.dbuser as any).save()

          await ctx.reply(ctx.i18n.t('appendtemplate_success'), Extra.inReplyTo(
            ctx.message.message_id
          ) as ExtraReplyMessage)
        } catch (err) {
          await ctx.replyWithHTML(`<code>${err.message}</code>`)
        }
      }
    }
  })
}
