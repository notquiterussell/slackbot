import { BotRouter } from '../../routing/botRouter';

export const actions = (router: BotRouter) => {
  router.if('action/dayofweek', async (intent, context) => {
    await context.sender.send(new Date().toLocaleDateString(context.message.context.locale, { weekday: 'long' }));
  });

  router.if('action/askthings', async (intent, context) => {
    await context.bot.beginDialog('my-dialog-name-constant');
  });

  router.if('action/travel.train', async (intent, context) => {
    console.log('Slots', context.message.context.turnState.get('slots'));
    await context.bot.beginDialog('train-travel', context.message.context.turnState.get('slots'));
  });
};
