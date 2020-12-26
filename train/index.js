const path = require('path');
const NlpManager = require('node-nlp/src/nlp/nlp-manager');

(async () => {
  const nlp = new NlpManager({ languages: ['en'], forceNER: true, trainByDomain: true });
  await nlp.addCorpus(path.join(__dirname, './corpus-en.json'));

  await nlp.train();
  nlp.save(path.join(__dirname, '..', 'features', 'model.json'));
})();
