import { BotRouter } from '../../routing/botRouter';

export const actions = (router: BotRouter) => {
  router.if('action/dayofweek', async (intent, context) => {
    await context.sender.send(new Date().toLocaleDateString(context.turnContext.locale, { weekday: 'long' }));
  });
};
