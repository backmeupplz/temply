// Dependencies
import { Telegraf, ContextMessageUpdate } from 'telegraf'

export function setupPreview(bot: Telegraf<ContextMessageUpdate>) {
  bot.command('preview', async ctx => {
    ctx.dbuser.hidePreview = !ctx.dbuser.hidePreview
    await (ctx.dbuser as any).save()
    ctx.replyWithHTML(
      ctx.i18n.t(ctx.dbuser.hidePreview ? 'previewOn' : 'previewOff')
    )
  })
}
