const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const qnaReplies = require('./qna-replies');

/**
 * @param nlp {NlpManager} NLP manager
 * @returns {Promise<void>}
 */
const process = nlp => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, 'qna.tsv'))
      .pipe(csv({ separator: '\t' }))
      .on('data', row => {
        const utterance = row.Question;

        const intent = row.Intent;
        // Get the replies before deciding its private
        const qnaReply = qnaReplies[intent];

        nlp.assignDomain('en', intent, 'qna');
        nlp.addDocument('en', utterance, intent);

        if (qnaReply) {
          qnaReply.forEach(answer => {
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
