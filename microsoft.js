//  __   __  ___        ___
// |__) /  \  |  |__/ |  |
// |__) \__/  |  |  \ |  |

// This is the main file for the Helperby bot.
const path = require('path');
const restify = require('restify');

const { UserState, MemoryStorage } = require('botbuilder-core');
const { BotFrameworkAdapter } = require('botbuilder');

const { WelcomeBot } = require('./bot/welcome');

const { NlpjsEngine, Answer, IntentAnalysis, EntityAnalysis, LanguageAnalysis } = require('botbuilder-nlpjs');

// Load process.env values from .env file
require('dotenv').config();

let memoryStorage = new MemoryStorage();
const userState = new UserState(memoryStorage);

if (process.env.MONGO_URI) {
  storage = mongoStorage = new MongoDbStorage({
    url: process.env.MONGO_URI,
  });
}

const bot = new WelcomeBot(userState);

NlpjsEngine.build({ languages: ['en'], forceNER: true }, path.join(__dirname, 'features', 'private.json')).then(
  nlpEngine => {
    const adapter = new BotFrameworkAdapter({
      appId: process.env.MicrosoftAppId,
      appPassword: process.env.MicrosoftAppPassword,
    });

    // Catch-all for errors.
    adapter.onTurnError = async (context, error) => {
      console.error(`\n [onTurnError] unhandled error: ${error}`);

      await context.sendTraceActivity(
        'OnTurnError Trace',
        `${error}`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
      );

      // Send a message to the user
      await context.sendActivity('The bot encountered an error or bug.');
      await context.sendActivity('To continue to run this bot, please fix the bot source code.');
    };

    adapter.use(new Answer(nlpEngine));
    adapter.use(new IntentAnalysis(nlpEngine));
    adapter.use(new EntityAnalysis(nlpEngine));

    // Create HTTP server
    const server = restify.createServer();
    server.listen(process.env.port || process.env.PORT || 3000, function () {
      console.log(`\n${server.name} listening to ${server.url}`);
      console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
      console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
    });

    // Listen for incoming activities and route them to your bot main dialog.
    server.post('/api/messages', (req, res) => {
      adapter.processActivity(req, res, async context => {
        // route to main dialog.
        await bot.run(context);
      });
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
