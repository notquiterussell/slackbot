const path = require('path');
const NlpManager = require('node-nlp/src/nlp/nlp-manager');

const privateTraining = ['smalltalk/smalltalk-private.json'];
const publicTraining = ['smalltalk/smalltalk-public.json'];

/**
 * Convert relative path to absolut
 * @param paths
 * @returns {[string]}
 */
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
  const nlp = new NlpManager({ languages: ['en'], forceNER: true, trainByDomain: true, autoSave: false });
  await nlp.addCorpora(corpora);

  await nlp.train();
  nlp.save(path.join(__dirname, '..', 'features', `${name}.json`));
};

(async () => {
  await train('private', [...toPath(privateTraining), ...toPath(publicTraining)]);
  await train('public', [...toPath(publicTraining)]);
})();
