import { BotFrameworkAdapter } from 'botbuilder';

export const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppID,
  appPassword: process.env.MicrosoftAppPassword,
});
