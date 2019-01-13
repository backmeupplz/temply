// Dependencies
import { Telegraf, ContextMessageUpdate, Extra } from 'telegraf'
import { Template } from '../models'
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types'

export function setupNewtemplate(bot: Telegraf<ContextMessageUpdate>) {
  bot.command(['newtemplate'], ctx => {
    ctx.replyWithHTML(ctx.i18n.t('newtemplate'))
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
      !ctx.message.reply_to_message.text.includes(': ') ||
      ctx.message.text.split(': ').length < 2
    ) {
      return next()
    }
    const name = ctx.message.text.split(': ')[0]
    const textArray = ctx.message.text.split(': ')
    textArray.shift()
    const text = textArray.join(': ')
    const template = new Template()
    template.name = name
    template.text = text

    ctx.dbuser.templates.push(template)
    await (ctx.dbuser as any).save()

    await ctx.reply(ctx.i18n.t('newtemplate_success'), Extra.inReplyTo(
      ctx.message.message_id
    ) as ExtraReplyMessage)
  })
}
