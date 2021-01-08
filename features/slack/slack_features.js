/**
 * Handle a public message.
 *
 * @param message The message to process
 * @param bot The bot to reply to
 * @returns {Promise<void>}
 */
const handlePublicMessageAndReplyThread = async (message, bot) => {
  if (message.text) {
    const answer = message.context.turnState.get('answer');
    console.log(message.context.turnState.get('intent'));
    console.log(message.context.turnState.get('entities'));
    console.log(message.context.turnState.get('language'));
    if (answer) {
      await bot.replyInThread(message, answer);
    }
  } else {
    await bot.replyInThread(message, 'You rang?');
  }
};

module.exports = controller => {
  controller.ready(async () => {
    if (process.env.MYTEAM) {
      const bot = await controller.spawn(process.env.MYTEAM);
      await bot.startConversationInChannel(process.env.MYCHAN, process.env.MYUSER);
      await bot.say('Hello.');
    }
  });

  controller.on('direct_message', async (bot, message) => {
    const answer = message.context.turnState.get('answer');

    if (answer) {
      await bot.reply(message, answer);
    } else {
      await bot.reply(message, `I don't understand '${message.text}'`);
    }
  });

  controller.on('direct_mention', async (bot, message) => {
    await handlePublicMessageAndReplyThread(message, bot);
  });

  controller.on('mention', async (bot, message) => {
    await handlePublicMessageAndReplyThread(message, bot);
  });

  /**
   * Listen to everything and see if we can help.
   */
  controller.hears('.*', 'message', async (bot, message) => {
    await handlePublicMessageAndReplyThread(message, bot);
  });
};
