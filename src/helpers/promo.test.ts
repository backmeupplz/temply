// node --test dist/helpers/promo.test.js (CI): the promo hook as Temply runs it
import { test } from 'node:test'
import * as assert from 'node:assert/strict'
import { arm, Config, decide, html, keyboard, memoryStore, promos, startPayload, unitOf } from './promo'

const BOT = 'temply'
const cfg = (over: Partial<Config['campaigns'][0]> = {}, enabled = true): Config => ({
  base: 'https://lumen.borodutch.com/go',
  bots: { [BOT]: { enabled, code: 'temply' } },
  campaigns: [
    {
      id: 'p1',
      bot: BOT,
      status: 'running',
      target: 'https://t.me/voicybot',
      chats: ['private'],
      cap_days: 7,
      langs: ['en', 'ru'],
      text: { en: 'Voice to text', ru: 'Голос в текст' },
      variants: [
        { id: 'a', share: 0.1, format: 'caption' },
        { id: 'b', share: 0.1, format: 'button', text: { en: 'Btn', ru: 'Кн' } },
      ],
      ...over,
    },
  ],
})
const users = Array.from({ length: 5000 }, (_, i) => 1000 + i)
const inArm = (id: string | undefined) => users.find((u) => (arm(cfg().campaigns[0], u) || { id: undefined }).id === id)

test('decide: deep links, languages, chats, caps, switches', () => {
  const a = decide(cfg(), BOT, 's', inArm('a'), 'private', 'en', undefined)
  assert.deepEqual(a.promo, { text: 'Voice to text', url: 'https://t.me/voicybot?start=p1-a-temply', format: 'caption' })
  assert.equal(decide(cfg(), BOT, 's', inArm('b'), 'private', 'ru', undefined).promo.text, 'Кн')
  assert.equal(decide(cfg(), BOT, 's', inArm(undefined), 'private', 'en', undefined).arm, 'holdout')
  assert.equal(decide(cfg(), BOT, 's', inArm('a'), 'group', 'en', undefined), null)
  assert.equal(decide(cfg(), BOT, 's', inArm('a'), 'private', 'uk', undefined), null)
  assert.equal(decide(cfg({}, false), BOT, 's', inArm('a'), 'private', 'en', undefined), null)
  assert.equal(decide(cfg({ status: 'paused' }), BOT, 's', inArm('a'), 'private', 'en', undefined), null)
  const now = Date.now()
  assert.equal(decide(cfg(), BOT, 's', inArm('a'), 'private', 'en', now - 6 * 86400_000, now).promo, undefined)
  assert.ok(decide(cfg(), BOT, 's', inArm('a'), 'private', 'en', now - 8 * 86400_000, now).promo)
  assert.equal(html({ text: 'A & B', url: 'https://t.me/x', format: 'caption' }), '\n\n<a href="https://t.me/x">A &amp; B</a>')
  assert.equal(keyboard({ text: 'B', url: 'https://t.me/x', format: 'button' }).inline_keyboard.length, 1)
  assert.equal(startPayload('/start@temply_bot xp1-a-vdb'), 'xp1-a-vdb')
})

test('hook: salt, cap in the store, events', async () => {
  const sent: { url: string; body?: string }[] = []
  const real = globalThis.fetch
  globalThis.fetch = (async (url: string, init?: { body?: string }) => {
    sent.push({ url, body: init && init.body })
    if (url.includes('/salt?bot=temply')) return new Response(JSON.stringify({ salt: 'S' }))
    if (url.endsWith('campaigns.json')) return new Response(JSON.stringify(cfg()))
    return new Response('{"stored": 1}')
  }) as typeof fetch
  try {
    const h = promos(BOT, memoryStore(), { PROMO_TOKEN: 't' })
    assert.equal(await h.decide(inArm('a'), 'private', 'en'), null) // no config yet
    await h.refresh()
    const d = await h.decide(inArm('a'), 'private', 'en')
    assert.equal(d.unit, unitOf('S', 'p1', inArm('a')))
    await h.record(d)
    assert.equal((await h.decide(inArm('a'), 'private', 'en')).promo, undefined) // capped
    h.blocked(inArm(undefined))
    await h.arrived(77, 'xp1-a-vdb', true)
    await h.used(77)
    await h.used(77)
    await h.flush()
    const ev = JSON.parse(sent[sent.length - 1].body).events.map((e: { v: string; k: string }) => `${e.v}:${e.k}`)
    assert.deepEqual(ev, ['a:seen', 'a:shown', 'holdout:blocked', 'a:start', 'a:new', 'a:use'])
    assert.equal(await promos(BOT, memoryStore(), {}).decide(1, 'private', 'en'), null) // off without a token
  } finally {
    globalThis.fetch = real
  }
})
