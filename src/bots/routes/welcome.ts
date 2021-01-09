import { BotRouter } from '../../routing/botRouter';

export const welcome = (router: BotRouter) => {
  router.if('welcome/bot.introduction', async (intent, context) => {
    const userName = context.message.context.turnState.activity.from.name;
    await context.sender.send(`Hello ${userName}, I'm Helperby the helpful bot`);
  });

  router.if('welcome/basic.help', async (intent, context) => {
    await context.sender.send("You can ask me questions like 'How do I reset my password' or 'What day is it?'");
  });
};
