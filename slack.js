//  __   __  ___        ___
// |__) /  \  |  |__/ |  |
// |__) \__/  |  |  \ |  |

// This is the main file for the Helperby bot.
const path = require('path');

const { Botkit } = require('botkit');

// Import a platform-specific adapter for slack.

const { SlackAdapter, SlackMessageTypeMiddleware, SlackEventMiddleware } = require('botbuilder-adapter-slack');
const { NlpjsEngine, Answer, IntentAnalysis, EntityAnalysis, LanguageAnalysis } = require('botbuilder-nlpjs');

// Load process.env values from .env file
require('dotenv').config();

let storage = null;
if (process.env.MONGO_URI) {
  storage = mongoStorage = new MongoDbStorage({
    url: process.env.MONGO_URI,
  });
}

NlpjsEngine.build({ languages: ['en'], forceNER: true }, path.join(__dirname, 'features', 'private.json')).then(
  nlpEngine => {
    const adapter = new BotFrameworkAdapter({
      appId: process.env.MicrosoftAppId,
      appPassword: process.env.MicrosoftAppPassword,
    });
    const slackAdapter = new SlackAdapter({
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
      getTokenForTeam: getTokenForTeam,
      getBotUserByTeam: getBotUserByTeam,
    });

    slackAdapter.use(new Answer(nlpEngine));
    slackAdapter.use(new IntentAnalysis(nlpEngine));
    slackAdapter.use(new EntityAnalysis(nlpEngine));
    slackAdapter.use(new LanguageAnalysis(['en', 'de'], 3));

    // Use SlackEventMiddleware to emit events that match their original Slack event types.
    slackAdapter.use(new SlackEventMiddleware());

    // Use SlackMessageType middleware to further classify messages as direct_message, direct_mention, or mention
    slackAdapter.use(new SlackMessageTypeMiddleware());

    const controller = new Botkit({
      webhook_uri: '/api/messages',

      adapter: slackAdapter,

      storage,
    });

    // Once the bot has booted up its internal services, you can use them to do stuff.
    controller.ready(() => {
      // load traditional developer-created local custom feature modules
      controller.loadModules(__dirname + '/features/slack');

      /* catch-all that uses the CMS to trigger dialogs */
      if (controller.plugins.cms) {
        controller.on('message,direct_message', async (bot, message) => {
          let results = false;
          results = await controller.plugins.cms.testTrigger(bot, message);

          if (results !== false) {
            // do not continue middleware!
            return false;
          }
        });
      }
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
  }
);

let tokenCache = {};
let userCache = {};

if (process.env.TOKENS) {
  tokenCache = JSON.parse(process.env.TOKENS);
}

if (process.env.USERS) {
  userCache = JSON.parse(process.env.USERS);
}

async function getTokenForTeam(teamId) {
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

async function getBotUserByTeam(teamId) {
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