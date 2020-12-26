const path = require('path');
const NlpManager = require('node-nlp/src/nlp/nlp-manager');

const privateTraining = [
  'small-talk/agent.json',
  'small-talk/appraisal.json',
  'small-talk/greetings.json',
  'small-talk/user.json',
];

const publicTraining = ['conversation-starters/starters.json', 'small-talk/greetings.json'];

const toPath = paths => {
  return paths.map(p => path.join(__dirname, p));
};

/**
 * Create the training model of the given name.
 *
 * @param name The name to save
 * @param corpora The corpora to train on
 * @returns {Promise<void>}
 */
const train = async (name, corpora) => {
  const nlp = new NlpManager({ languages: ['en'], forceNER: true, trainByDomain: true });
  await nlp.addCorpora(corpora);

  await nlp.train();
  nlp.save(path.join(__dirname, '..', 'features', `${name}.json`));
};

(async () => {
  await train('private', [...toPath(privateTraining), ...toPath(publicTraining)]);
  await train('public', [...toPath(publicTraining)]);
})();
