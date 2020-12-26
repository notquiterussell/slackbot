/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const path = require('path');
const { NlpManager } = require('node-nlp');

let privateNlp = null;
let publicNlp = null;

/**
 * Build the NLP.
 *
 * @param settings The settings
 * @param filename The filename
 * @returns {Promise<NlpManager>}
 */
const buildNlp = async (settings, filename) => {
  const nlp = new NlpManager(settings);
  await nlp.load(path.join(__dirname, filename));
  return nlp;
};

const nlpReady = new Promise(async resolve => {
  const settings = {
    languages: ['en'],
    forceNER: true,
  };

  if (process.env.DUCKLING_URL) {
    settings.ner = { ducklingUrl: process.env.DUCKLING_URL };
  }
  privateNlp = await buildNlp(settings, 'private.json');
  publicNlp = await buildNlp(settings, 'public.json');
  resolve();
});

/**
 * Handle a public message.
 *
 * @param message The message to process
 * @param bot The bot to reply to
 * @returns {Promise<void>}
 */
const handlePublicMessageAndReplyThread = async (message, bot) => {
  if (message.text) {
    const reply = await publicNlp.process(message.text);
    if (reply.intent !== 'None' && reply.answer) {
      await bot.replyInThread(message, reply.answer);
    }
  } else {
    await bot.replyInThread(message, 'You rang?');
  }
};

module.exports = controller => {
  controller.ready(async () => {
    await nlpReady;
    console.log('NLP ready to go');

    if (process.env.MYTEAM) {
      let bot = await controller.spawn(process.env.MYTEAM);
      await bot.startConversationInChannel(process.env.MYCHAN, process.env.MYUSER);
      bot.say('Hello.');
    }
  });

  controller.on('direct_message', async (bot, message) => {
    const reply = await privateNlp.process(message.text);
    console.log(JSON.stringify(reply, null, 2));

    if (reply.intent === 'None') {
      await bot.reply(message, `I don't understand '${message.text}'`);
    } else {
      await bot.reply(message, reply.answer);
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
