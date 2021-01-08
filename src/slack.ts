import { ConversationState, MemoryStorage, UserState } from 'botbuilder';
import { SlackAdapter, SlackMessageTypeMiddleware, SlackEventMiddleware } from 'botbuilder-adapter-slack';
import { Botkit, BotWorker, BotkitMessage } from 'botkit';
import { NlpjsEngine, Answer, IntentAnalysis, EntityAnalysis } from 'botbuilder-nlpjs';
import { BotContext, BotRouter, Sender } from './routing/botRouter';
import { router } from './bots/routes';

const adapter = new SlackAdapter({
  // parameters used to secure webhook endpoint
  verificationToken: process.env.VERIFICATION_TOKEN,
  clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,

  // auth token for a single-team app
  botToken: process.env.BOT_TOKEN,

  // credentials used to set up oauth for multi-team apps
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  scopes: ['bot'],
  redirectUri: process.env.REDIRECT_URI,

  // functions required for retrieving team-specific info
  // for use in multi-team apps
  getTokenForTeam,
  getBotUserByTeam,
});

// Use SlackEventMiddleware to emit events that match their original Slack event types.
adapter.use(new SlackEventMiddleware());

// Use SlackMessageType middleware to further classify messages as direct_message, direct_mention, or mention
adapter.use(new SlackMessageTypeMiddleware());

adapter.onTurnError = async (context, error) => {
  console.error(`\n [onTurnError] unhandled error: ${error}`);

  await context.sendTraceActivity(
    'OnTurnError Trace',
    `${error}`,
    'https://www.botframework.com/schemas/error',
    'TurnError'
  );

  // Send a message to the user
  await context.sendActivity('The bot encounted an error or bug.');
  await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

const memoryStorage = new MemoryStorage();
const userState = new UserState(memoryStorage);
const conversationState = new ConversationState(memoryStorage);

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

    const cb = router.match(intent);
    if (cb) {
      const ctx: BotContext = {
        turnContext: message.context,
        userState: userState,
        conversationState: conversationState,
        sender: new SlackSender(bot, message, true),
      };

      await cb(intent, ctx);
    }
  } else {
    await bot.replyInThread(message, 'You rang?');
  }
};

NlpjsEngine.build({ languages: ['en'], forceNER: true }, process.env.MODEL).then(nlpEngine => {
  adapter.use(new Answer(nlpEngine));
  adapter.use(new IntentAnalysis(nlpEngine));
  adapter.use(new EntityAnalysis(nlpEngine));

  const controller = new Botkit({
    webhook_uri: '/api/messages',
    adapter,
    storage: memoryStorage,
  });

  controller.ready(async () => {
    if (process.env.MYTEAM) {
      const bot = await controller.spawn(process.env.MYTEAM, adapter);
      // @ts-ignore
      await bot.startConversationInChannel(process.env.MYCHAN, process.env.MYUSER);
      await bot.say('Hello.');
    }
  });

  controller.on('direct_message', async (bot, message) => {
    const intent = message.context.turnState.get('intent');

    const cb = router.match(intent);
    if (cb) {
      const ctx: BotContext = {
        turnContext: message.context,
        userState: userState,
        conversationState: conversationState,
        sender: new SlackSender(bot, message, false),
      };

      await cb(intent, ctx);
    } else {
      await bot.reply(message, `I don't understand '${message.text}'`);
    }
  });

  controller.on('direct_mention', async (bot, message) => {
    await handlePublicMessageAndReplyThread(message, bot);
  });

  controller.on('mention', async (bot, message) => {
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

let tokenCache = {};
let userCache = {};

if (process.env.TOKENS) {
  tokenCache = JSON.parse(process.env.TOKENS);
}

if (process.env.USERS) {
  userCache = JSON.parse(process.env.USERS);
}

async function getTokenForTeam(teamId): Promise<string> {
  if (tokenCache[teamId]) {
    return new Promise(resolve => {
      setTimeout(function () {
        resolve(tokenCache[teamId]);
      }, 150);
    });
  } else {
    console.error('Team not found in tokenCache: ', teamId);
  }
}

async function getBotUserByTeam(teamId): Promise<string> {
  if (userCache[teamId]) {
    return new Promise(resolve => {
      setTimeout(function () {
        resolve(userCache[teamId]);
      }, 150);
    });
  } else {
    console.error('Team not found in userCache: ', teamId);
  }
}
