const { BotkitConversation } = require('botkit');

/**
 * Handle a public message.
 *
 * @param message The message to process
 * @param bot The bot to reply to
 * @returns {Promise<void>}
 */
const handleReplyToMessage = async (message, bot) => {
  if (message.text) {
    const answer = message.context.turnState.get('answer');
    const intent = message.context.turnState.get('intent');
    console.log(intent);
    console.log(message.context.turnState.get('entities'));
    console.log(message.context.turnState.get('language'));

    if (intent && intent !== 'None') {
      // await message.addAction(intent);
      await bot.reply(answer);
    } else {
      await bot.reply(message, `I don't understand '${message.text}'`);
    }
  } else {
    await bot.reply(message, 'You rang?');
  }
};

module.exports = controller => {
  controller.ready(async () => {
    const my_dialog = new BotkitConversation('my_dialog', controller);
    my_dialog.say('Hello');

    // Add the dialog to the Botkit controller
    controller.addDialog(my_dialog);

    console.log(controller._events);
  });

  // Later on, trigger the dialog into action!
  controller.on('connect', async (bot, message) => {
    await bot.reply('Hello');
    await bot.beginDialog('my_dialog');
  });

  controller.on('channel_join', function (bot, event) {
    bot.reply(event, 'Welcome to the channel!');
  });

  /**
   * Listen to everything and see if we can help.
   */
  controller.hears('.*', 'message', async (bot, message) => {
    await handleReplyToMessage(message, bot);
  });
};
