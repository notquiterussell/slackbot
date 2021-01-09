import { ActionTypes, ActivityHandler, CardFactory, TurnContext } from 'botbuilder';
import { UserState } from 'botbuilder-core';
import { Intent } from 'botbuilder-nlpjs';

import { router } from './routes';
import { BotContext, Sender } from '../routing/botRouter';

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

    // await context.sendActivity({ text: JSON.stringify(card), attachments: [card] });
    await context.sendActivity({
      text: 'Would you like to play a game?',
      attachments: [card],
    });
  }

  private static async dispatchToIntent(intentOrString: Intent | String, context: TurnContext) {
    let intent: Intent;
    if (['string', 'String'].includes(typeof intentOrString)) {
      intent = { intent: intentOrString as string, score: 1, domain: 'Default' };
    } else {
      intent = intentOrString as Intent;
    }
    const cb = router.match(intent);

    if (cb) {
      const ctx: BotContext = {
        bot: null,
        message: null,
        sender: new MicrosoftSender(context),
      };
      await cb(intent, ctx);
    } else {
      console.log(`No action found for intent ${intent.intent}`);
      await WelcomeBot.sendIntroCard(context);
    }
  }
}

class MicrosoftSender implements Sender {
  private _turnContext: TurnContext;

  constructor(turnContext: TurnContext) {
    this._turnContext = turnContext;
  }

  send(data: any): Promise<any> | undefined {
    return this._turnContext.sendActivity(data);
  }
}
