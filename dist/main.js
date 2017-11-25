"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('source-map-support').install(); // tslint:disable-line:no-require-imports
const slack_1 = require("./clients/slack");
const discord_1 = require("./clients/discord");
const cli_1 = require("./clients/cli");
const server_1 = require("./components/server");
const env_1 = require("./env");
server_1.createServer(env_1.env.PORT);
const botName = env_1.env.BOT_NAME;
if (env_1.env.USE_CLI) {
    cli_1.makeCLIBot(botName);
}
else {
    if (env_1.env.SLACK_TOKENS.length > 0) {
        const slackBots = env_1.env.SLACK_TOKENS
            .split(',')
            .map(t => t.trim())
            .map(t => slack_1.makeSlackBot(botName, t));
        slackBots.forEach(bot => bot.login());
    }
    if (env_1.env.DISCORD_TOKEN.length > 0) {
        const discordBot = discord_1.makeDiscordBot(botName, env_1.env.DISCORD_TOKEN);
        discordBot.login();
    }
}
//# sourceMappingURL=main.js.map