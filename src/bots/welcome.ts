// Import required Bot Framework classes.
import { ActionTypes, ActivityHandler, CardFactory, StatePropertyAccessor, TurnContext } from 'botbuilder';
import { UserState } from 'botbuilder-core';
import { BotRouter } from '../routing/botRouter';
import { Intent } from 'botbuilder-nlpjs';

// Welcomed User property name
const WELCOMED_USER = 'welcomedUserProperty';

const router = new BotRouter();

router.if('smalltalk/.*', async (intent, context) => {
  await context.sendActivity(context.turnState.get('answer'));
});

router.if('qna/.*', async (intent, context) => {
  await context.sendActivity(context.turnState.get('answer'));
});

router.if('welcome/bot.introduction', async (intent, context) => {
  const userName = context.activity.from.name;
  await context.sendActivity(`Hello ${userName}, I'm Helperby the helpful bot`);
});

router.if('welcome/basic.help', async (intent, context) => {
  await context.sendActivity("You can ask me questions like 'How do I reset my password' or 'What day is it?'");
});

router.if('action/dayofweek', async (intent, context) => {
  await context.sendActivity(new Date().toLocaleDateString(context.locale, { weekday: 'long' }));
});

export class WelcomeBot extends ActivityHandler {
  private userState: UserState;

  public constructor(userState: UserState) {
    super();
    this.userState = userState;

    this.onMessage(async (context, next) => {
      const intent = context.turnState.get('intent');
      await WelcomeBot.dispatchToIntent(intent, context);

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    // Sends welcome messages to conversation members when they join the conversation.
    // Messages are only sent to conversation members who aren't the bot.
    this.onMembersAdded(async (context, next) => {
      // Iterate over all new members added to the conversation
      for (const idx in context.activity.membersAdded) {
        // Greet anyone that was not the target (recipient) of this message.
        // Since the bot is the recipient for events from the channel,
        // context.activity.membersAdded === context.activity.recipient.Id indicates the
        // bot was added to the conversation, and the opposite indicates this is a user.
        if (context.activity.membersAdded[idx].id !== context.activity.recipient.id) {
          await WelcomeBot.dispatchToIntent('welcome/bot.introduction', context);
          await WelcomeBot.dispatchToIntent('welcome/basic.help', context);
        }
      }

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });
  }

  /**
   * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
   */
  async run(context) {
    await super.run(context);

    // Save state changes
    await this.userState.saveChanges(context);
  }

  private static async sendIntroCard(context) {
    const card = CardFactory.heroCard(
      'Welcome to Bot Framework!',
      'Welcome to Welcome Users bot sample! This Introduction card is a great way to introduce your Bot to the user and suggest some things to get them started. We use this opportunity to recommend a few next steps for learning more creating and deploying bots.',
      ['https://aka.ms/bf-welcome-card-image'],
      [
        {
          type: ActionTypes.OpenUrl,
          title: 'Get an overview',
          value: 'https://docs.microsoft.com/en-us/azure/bot-service/?view=azure-bot-service-4.0',
        },
        {
          type: ActionTypes.OpenUrl,
          title: 'Ask a question',
          value: 'https://stackoverflow.com/questions/tagged/botframework',
        },
        {
          type: ActionTypes.OpenUrl,
          title: 'Learn how to deploy',
          value:
            'https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-deploy-azure?view=azure-bot-service-4.0',
        },
      ]
    );

    await context.sendActivity({ attachments: [card] });
  }

  private static async dispatchToIntent(intent: Intent | String, context: TurnContext) {
    let theIntent: Intent;
    if (['string', 'String'].includes(typeof intent)) {
      theIntent = { intent: intent as string, score: 1, domain: 'Default' };
    } else {
      theIntent = intent as Intent;
    }
    const cb = router.match(theIntent);
    if (cb) {
      await cb(theIntent, context);
    } else {
      console.log(`No action found for intent ${theIntent.intent}`);
      await WelcomeBot.sendIntroCard(context);
    }
  }
}
