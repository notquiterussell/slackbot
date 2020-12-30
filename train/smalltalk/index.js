const path = require('path');
const fs = require('fs');

const parse = require('csv-parse');

const smalltalkReplies = require('../../bot/smalltalk-replies');

const inputFile = path.join(__dirname, 'smalltalk.tsv');

/**
 * Append the intent to the corpus. Only provides a reply if intent should be replied to. This allows for a more
 * formal bot in public channels, and a cheekier bot in private.
 *
 * @param corpus {*} The corpus to append
 * @param intent {string} The intent to append to it
 * @param utterance {string} The utterance to append
 * @param appendReply {boolean} Is this public?
 */
const append = (corpus, intent, utterance, appendReply) => {
  let datum = corpus.data.find(i => i.intent === intent);

  if (!datum) {
    datum = { intent: intent, utterances: [], answers: [] };
    corpus.data.push(datum);
  }

  datum.utterances.push(utterance);
  if (appendReply) {
    datum.answers = smalltalkReplies[intent];
  }
};

const parser = parse({ delimiter: '\t', from_line: 2 }, async (err, data) => {
  const publicCorpus = {
    locale: 'en',
    name: 'smalltalk-public',
    data: [],
  };
  const privateCorpus = {
    locale: 'en',
    name: 'smalltalk-private',
    data: [],
  };

  for (let item of data) {
    const intent = item[1];
    const utterance = item[0];
    const isPublic = item[2] === 'TRUE';

    append(publicCorpus, intent, utterance, isPublic);
    append(privateCorpus, intent, utterance, true);
  }

  fs.writeFileSync(path.join(__dirname, 'smalltalk-public.json'), JSON.stringify(publicCorpus));
  fs.writeFileSync(path.join(__dirname, 'smalltalk-private.json'), JSON.stringify(privateCorpus));
});

fs.createReadStream(inputFile).pipe(parser);