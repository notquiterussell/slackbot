import { router } from '../../bots/routes';
import { BotContext, Sender } from '../../routing/botRouter';
import { BotkitMessage, BotWorker } from 'botkit';
import { tokenCache, userCache } from '../../adapters/slack-adapter';

/**
 * Handle a public message.
 *
 * @param message The message to process
 * @param bot The bot to reply to
 * @returns {Promise<void>}
 */
const handlePublicMessageAndReplyThread = async (message, bot) => {
  if (message.text) {
    const intent = message.context.turnState.get('intent');

    // Don't reply to intents for private channels
    if (intent.intent.endsWith(':private')) {
      return;
    }

    const cb = router.match(intent);
    if (cb) {
      const ctx: BotContext = {
        bot,
        message,
        sender: new SlackSender(bot, message, true),
      };

      await cb(intent, ctx);
    }
  } else {
    await bot.replyInThread(message, 'You rang?');
  }
};

class SlackSender implements Sender {
  private readonly _botWorker: BotWorker;
  private readonly _message: BotkitMessage;
  private readonly _threadReply: boolean;

  constructor(botWorker: BotWorker, message: BotkitMessage, threadReply: boolean) {
    this._botWorker = botWorker;
    this._message = message;
    this._threadReply = threadReply;
  }

  send(data: any): Promise<any> | undefined {
    if (this._threadReply) {
      // @ts-ignore
      return this._botWorker.replyInThread(this._message, data);
    }
    return this._botWorker.reply(this._message, data);
  }
}

module.exports = controller => {
  controller.ready(async () => {
    if (process.env.MYTEAM) {
      const bot = await controller.spawn(process.env.MYTEAM);
      // @ts-ignore
      await bot.startConversationInChannel(process.env.MYCHAN, process.env.MYUSER);
      await bot.say('Hello.');
    }

    controller.on('direct_message', async (bot, message) => {
      const intent = message.context.turnState.get('intent');

      const cb = router.match(intent);
      if (cb) {
        const ctx: BotContext = {
          bot,
          message,
          sender: new SlackSender(bot, message, false),
        };

        await cb(intent, ctx);
      } else {
        await bot.reply(message, `I don't understand '${message.text}'`);
      }
    });

    controller.on(['direct_mention', 'mention'], async (bot, message) => {
      await handlePublicMessageAndReplyThread(message, bot);
    });

    /**
     * Listen to everything and see if we can help.
     */
    controller.hears('.*', 'message', async (bot, message) => {
      await handlePublicMessageAndReplyThread(message, bot);
    });

    controller.webserver.get('/', (req, res) => {
      res.send(`This app is running Botkit ${controller.version}.`);
    });

    controller.webserver.get('/install', (req, res) => {
      // getInstallLink points to slack's oauth endpoint and includes clientId and scopes
      res.redirect(controller.adapter.getInstallLink());
    });

    controller.webserver.get('/install/auth', async (req, res) => {
      try {
        const results = await controller.adapter.validateOauthCode(req.query.code);

        console.log('FULL OAUTH DETAILS', results);

        // Store token by team in bot state.
        tokenCache[results.team_id] = results.bot.bot_access_token;

        // Capture team to bot id
        userCache[results.team_id] = results.bot.bot_user_id;

        res.json('Success! Bot installed.');
      } catch (err) {
        console.error('OAUTH ERROR:', err);
        res.status(401);
        res.send(err.message);
      }
    });
  });
};
