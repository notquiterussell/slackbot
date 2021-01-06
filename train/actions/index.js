const path = require('path');
const fs = require('fs');
const parse = require('csv-parse');

const inputFile = path.join(__dirname, 'actions.tsv');

/**
 * Append the intent to the corpus.
 *
 * @param corpus {*} The corpus to append
 * @param intent {string} The intent to append to it
 * @param utterance {string} The utterance to append
 */
const append = (corpus, intent, utterance) => {
  let datum = corpus.data.find(i => i.intent === intent);

  if (!datum) {
    datum = { intent: intent, utterances: [], answers: [] };
    corpus.data.push(datum);
  }

  datum.utterances.push(utterance);
};

const parser = parse({ delimiter: '\t', from_line: 2 }, async (err, data) => {
  const actionCorpus = {
    locale: 'en',
    name: 'actions',
    data: [],
  };

  for (let item of data) {
    const intent = item[1];
    const utterance = item[0];

    append(actionCorpus, intent, utterance);
  }

  fs.writeFileSync(path.join(__dirname, 'actions.json'), JSON.stringify(actionCorpus));
});

fs.createReadStream(inputFile).pipe(parser);
