const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const travel = require('./travel');

/**
 * @param nlp {NlpManager} NLP manager
 * @returns {Promise<void>}
 */
const process = nlp => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, 'actions.tsv'))
      .pipe(csv({ separator: '\t' }))
      .on('data', row => {
        const utterance = row.Question;

        const intent = row.Intent;

        nlp.assignDomain('en', intent, 'actions');
        nlp.addDocument('en', utterance, intent);

        travel(nlp);
      })
      .on('end', () => {
        resolve();
      });
  });
};

module.exports = process;
