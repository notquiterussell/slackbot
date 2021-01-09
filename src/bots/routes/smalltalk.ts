import { BotRouter } from '../../routing/botRouter';

export const smalltalk = (router: BotRouter): void => {
  router.if('smalltalk/.*', async (intent, context) => {
    await context.sender.send(context.message.context.turnState.get('answer'));
  });
};
