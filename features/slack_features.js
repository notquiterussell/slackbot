/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const path = require('path');
const { NlpManager } = require('node-nlp');

let nlpjs = null;

const nlpReady = new Promise(async resolve => {
  const settings = {
    languages: ['en'],
    forceNER: true,
  };

  if (process.env.DUCKLING_URL) {
    settings.ner = { ducklingUrl: process.env.DUCKLING_URL };
  }

  const nlp = new NlpManager(settings);

  await nlp.load(path.join(__dirname, 'model.json'));
  nlpjs = nlp;
  resolve();
});

async function handleMessageAndReplyThread(message, bot) {
  const reply = await nlpjs.process(message.text);
  console.log(JSON.stringify(reply, null, 2));
  if (reply.intent !== 'None' && reply.answer) {
    await bot.replyInThread(message, reply.answer);
  }
}

module.exports = function (controller) {
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
    const reply = await nlpjs.process(message.text);
    console.log(JSON.stringify(reply, null, 2));

    if (reply.intent === 'None') {
      await bot.reply(message, `I don't understand '${message.text}'`);
    } else {
      await bot.reply(message, reply.answer);
    }
  });

  controller.on('direct_mention', async (bot, message) => {
    await handleMessageAndReplyThread(message, bot);
  });

  controller.on('mention', async (bot, message) => {
    await handleMessageAndReplyThread(message, bot);
  });
};
