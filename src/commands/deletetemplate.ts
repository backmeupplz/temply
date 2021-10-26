// Dependencies
import { Telegraf, ContextMessageUpdate, Markup as m } from 'telegraf'
import { User } from '../models'

export function setupDeletetemplate(bot: Telegraf<ContextMessageUpdate>) {
  bot.command('deletetemplate', (ctx) => {
    return ctx.reply(ctx.i18n.t('deletetemplate'), {
      reply_markup: templateKeyboard(ctx.dbuser),
    })
  })

  bot.action(/r~.+/, async (ctx) => {
    ctx.dbuser.templates = ctx.dbuser.templates.filter(
      (t) => t.name.indexOf(ctx.callbackQuery.data.split('~')[1]) < 0
    )
    await (ctx.dbuser as any).save()
    ctx.editMessageReplyMarkup(templateKeyboard(ctx.dbuser))
  })
}

function templateKeyboard(user: User) {
  const result = []
  user.templates.forEach((template) => {
    const humanName =
      template.name.length > 30
        ? `${template.name.slice(0, 30)}...`
        : template.name
    result.push([
      m.callbackButton(humanName, `r~${template.name.substr(0, 30)}`),
    ])
  })
  return m.inlineKeyboard(result)
}
