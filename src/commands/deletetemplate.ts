// Dependencies
import { Telegraf, ContextMessageUpdate, Markup as m } from 'telegraf'
import { User } from '../models'

export function setupDeletetemplate(bot: Telegraf<ContextMessageUpdate>) {
  bot.command('deletetemplate', ctx => {
    ctx.reply(ctx.i18n.t('deletetemplate'), {
      reply_markup: templateKeyboard(ctx.dbuser),
    })
  })

  bot.action(/r~.+/, async ctx => {
    ctx.dbuser.templates = ctx.dbuser.templates.filter(
      t => t.name !== ctx.callbackQuery.data.split('~')[1]
    )
    await (ctx.dbuser as any).save()
    ctx.editMessageReplyMarkup(templateKeyboard(ctx.dbuser))
  })
}

function templateKeyboard(user: User) {
  const result = []
  user.templates.forEach(template => {
    result.push([m.callbackButton(template.name, `r~${template.name}`)])
  })
  return m.inlineKeyboard(result)
}
