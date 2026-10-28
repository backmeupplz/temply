// Dependencies
import { Telegraf, ContextMessageUpdate } from 'telegraf'
import { html, keyboard, startPayload } from '../helpers/promo'
import { promo, promoLang } from '../helpers/promoHook'

export function setupHelp(bot: Telegraf<ContextMessageUpdate>) {
  bot.command(['help', 'start'], async (ctx) => {
    const isPrivate = ctx.chat.type === 'private'
    // another bot's campaign link brought this user here (/start <campaign>-<variant>-<bot>)
    const payload = isPrivate ? startPayload(ctx.message.text) : undefined
    if (payload) {
      const created = new Date((ctx.dbuser as any).createdAt).getTime()
      await promo.arrived(ctx.from.id, payload, Date.now() - created < 10 * 60_000)
    }
    // a promo line or button, private chats only
    const d = isPrivate ? await promo.decide(ctx.from.id, 'private', promoLang(ctx)) : null
    await ctx.replyWithHTML(ctx.i18n.t('helpTemply') + html(d?.promo), {
      disable_web_page_preview: true,
      reply_markup: keyboard(d?.promo),
    } as any)
    await promo.record(d)
  })
}
