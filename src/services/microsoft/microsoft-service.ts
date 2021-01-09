import { BotContext, Sender } from '../../routing/botRouter';
import { TurnContext } from 'botbuilder';
import { router } from '../../bots/routes';

class MicrosoftSender implements Sender {
  private _turnContext: TurnContext;

  constructor(turnContext: TurnContext) {
    this._turnContext = turnContext;
  }

  async send(data: any): Promise<any> | undefined {
    await this._turnContext.sendActivities([{ type: 'typing' }, { type: 'delay', value: 1000 }]);
    return this._turnContext.sendActivity(data);
  }
}

module.exports = controller => {
  controller.ready(async () => {
    controller.hears('.*', 'message', async (bot, message) => {
      const intent = message.context.turnState.get('intent');

      const cb = router.match(intent);
      if (cb) {
        const ctx: BotContext = {
          bot,
          message,
          sender: new MicrosoftSender(message.context),
        };

        await cb(intent, ctx);
      } else {
        await bot.reply(message, `I don't understand '${message.text}'`);
      }
    });
  });
};
