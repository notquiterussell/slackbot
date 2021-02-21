const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const smalltalkReplies = require('./smalltalk-replies');

/**
 * @param nlp {NlpManager} NLP manager
 * @returns {Promise<void>}
 */
const process = nlp => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, 'smalltalk.tsv'))
      .pipe(csv({ separator: '\t' }))
      .on('data', row => {
        const utterance = row.Question;

        let intent = row.Answer;
        // Get the replies before deciding its private
        const smalltalkReply = smalltalkReplies[intent];

        if (row.Public === 'FALSE') {
          intent = `${intent}:private`;
        }

        nlp.assignDomain('en', intent, 'smalltalk');
        nlp.addDocument('en', utterance, intent);

        if (smalltalkReply) {
          smalltalkReply.forEach(answer => {
            nlp.addAnswer('en', intent, answer);
          });
        } else {
          console.log('No reply for intent', intent);
        }
      })
      .on('end', () => {
        resolve();
      });
  });
};

module.exports = process;
