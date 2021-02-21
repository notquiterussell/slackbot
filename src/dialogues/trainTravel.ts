import { BotkitConversation } from 'Botkit';

module.exports = controller => {
  controller.ready(async () => {
    let convo = new BotkitConversation('train-travel', controller);

    // send a greeting
    convo.say('Howdy!');

    // ask a question, store the response in 'name'
    convo.ask(
      'What is your name?',
      async (response, convo, bot) => {
        console.log('Vars', convo.vars);
      },
      'name'
    );

    controller.addDialog(convo);
  });
};
