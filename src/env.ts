import * as fs from 'fs'
import * as envalid from 'envalid'

type EnvSchema = {
  BOT_NAME : string
  DATA_DIR : string
  SLACK_TOKENS : string
  DISCORD_TOKEN : string
  HOSTNAME : string
  PORT : number
  USE_CLI : boolean
}

export const env = envalid.cleanEnv<EnvSchema>(process.env, {
  BOT_NAME: envalid.str({ default: 'bort' }),
  DATA_DIR: envalid.str({ default: 'persist' }),
  SLACK_TOKENS: envalid.str({
    default: '',
    desc: 'A Slack API token, or a comma-separated list of Slack API tokens.'
  }),
  DISCORD_TOKEN: envalid.str({ default: '' }),
  HOSTNAME: envalid.str({ devDefault: 'localhost' }),
  PORT: envalid.num({ devDefault: 8080 }),
  USE_CLI: envalid.bool({
    default: false,
    desc: 'Start up an interface that reads from stdin and prints to stdout instead of connecting to servers.'
  })
}, { strict: true })

if(!fs.existsSync(env.DATA_DIR)) {
  console.log(env.DATA_DIR + ' not found! creating.')
  fs.mkdirSync(env.DATA_DIR)
}

const isValidConfiguration = env.USE_CLI ||
  env.SLACK_TOKENS ||
  env.DISCORD_TOKEN

if(!isValidConfiguration) {
  console.warn(`Environment configuration doesn't appear to be valid! Bot will do nothing if you're not running in CLI mode.`)
  const configInfo = Object.entries({
    'Slack': env.SLACK_TOKENS ? 'OK' : 'NONE',
    'Discord': env.DISCORD_TOKEN ? 'OK' : 'NONE'
  }).map(tuple => tuple.join(': ')).join('\n')
  console.log(configInfo)
}
