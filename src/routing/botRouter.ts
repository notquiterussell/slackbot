import { ConversationState, TurnContext, UserState } from 'botbuilder';
import type { Intent } from 'botbuilder-nlpjs';

export interface Sender {
  /**
   * Send the given data to the bot.
   * @param data The data to send
   */
  send(data: any): Promise<any> | undefined;
}

export type BotContext = {
  turnContext: TurnContext;

  sender: Sender;
  userState: UserState;
  conversationState: ConversationState;
};

export interface BotAction {
  (intent: Intent, context: BotContext): Promise<void>;
}

type BotCallback = { intentRegex: RegExp; callback: BotAction };

export class BotRouter {
  private routes: [BotCallback?] = [];

  /**
   * Adds the given pattern and callback to the routing table. Overlapping patterns are not allowed.
   *
   * @param pattern The pattern to match
   * @param callback The callback to execute
   */
  if(pattern: string, callback: BotAction): void {
    this.routes.forEach(route => {
      if (pattern.match(route.intentRegex)) {
        throw new Error(`The intent ${pattern} has already been registered as ${route.intentRegex}`);
      }
    });

    const route = {
      intentRegex: new RegExp(`^${pattern}$`),
      callback,
    };
    this.routes.push(route);
  }

  /**
   * Match the given intent against the router. Returns the callback to execute on match.
   *
   * @param intent The intent to match
   */
  match(intent: Intent): BotAction | undefined {
    try {
      const callbackMatch = this.routes.find(route => intent.intent.match(route.intentRegex));
      if (callbackMatch) {
        return callbackMatch.callback;
      }
    } catch (e) {
      console.log(`Error in intent ${intent}`, e);
      throw e;
    }
  }
}
