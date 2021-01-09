import { BotRouter } from '../../routing/botRouter';

export const qna = (router: BotRouter): void => {
  router.if('qna/.*', async (intent, context) => {
    await context.sender.send(context.message.context.turnState.get('answer'));
  });
};
