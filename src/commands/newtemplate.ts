// Dependencies
import { Telegraf, ContextMessageUpdate } from 'telegraf'
import { Template } from '../models'
import { html, keyboard } from '../helpers/promo'
import { promo, promoLang } from '../helpers/promoHook'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

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
      !ctx.message.reply_to_message.text.includes('💪') ||
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
    const template = new Template()
    template.name = name
    template.text = text

    try {
      await ctx.replyWithHTML(text)
      ctx.dbuser.templates.push(template)
      await (ctx.dbuser as any).save()
      // a template made in the week after another bot's campaign brought the user
      await promo.used(ctx.from.id)

      // a promo line or button, private chats only
      const d =
        ctx.chat.type === 'private'
          ? await promo.decide(ctx.from.id, 'private', promoLang(ctx))
          : null
      await ctx.reply(esc(ctx.i18n.t('newtemplate_success')) + html(d?.promo), {
        reply_to_message_id: ctx.message.message_id,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: keyboard(d?.promo),
      } as any)
      await promo.record(d)
    } catch (err) {
      await ctx.replyWithHTML(`<code>${err.message}</code>`)
    }
  })
}
