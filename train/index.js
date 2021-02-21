const path = require('path');

const { NlpManager } = require('node-nlp');

const smalltalk = require('./smalltalk');
const qna = require('./qna');
const actions = require('./actions');

/**
 * Create the training model of the given name.
 *
 * @param name The name to save
 * @returns {Promise<void>}
 */
const train = async name => {
  const nlp = new NlpManager({ languages: ['en'], forceNER: true, trainByDomain: true, autoSave: false });

  await smalltalk(nlp);
  await qna(nlp);
  await actions(nlp);

  await nlp.train();
  nlp.save(path.join(__dirname, '..', 'features', `${name}.json`));
};

// Main
(async () => {
  await train('private');
})();
