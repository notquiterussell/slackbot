import * as restify from 'restify';
import { BotFrameworkAdapter, MemoryStorage, UserState } from 'botbuilder';
import { NlpjsEngine, Answer, IntentAnalysis, EntityAnalysis } from 'botbuilder-nlpjs';
import { WelcomeBot } from './bots/welcome';

const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppID,
  appPassword: process.env.MicrosoftAppPassword,
});

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

const myBot = new WelcomeBot(userState);

NlpjsEngine.build({ languages: ['en'], forceNER: true }, process.env.MODEL).then(nlpEngine => {
  adapter.use(new Answer(nlpEngine));
  adapter.use(new IntentAnalysis(nlpEngine));
  adapter.use(new EntityAnalysis(nlpEngine));

  const server = restify.createServer();
  server.listen(process.env.port || process.env.PORT || 3001, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
  });
  server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async context => {
      // Route to main dialog.
      await myBot.run(context);
    });
  });
});
