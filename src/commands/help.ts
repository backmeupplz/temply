// Dependencies
import { Telegraf, ContextMessageUpdate } from 'telegraf'

export function setupHelp(bot: Telegraf<ContextMessageUpdate>) {
  bot.command(['help', 'start'], (ctx) => {
    ctx.replyWithHTML(ctx.i18n.t('helpTemply'), {
      disable_web_page_preview: true,
    })
  })
}
