import * as path from 'path';

import { BotAdapter, Storage } from 'botbuilder';
import { Botkit } from 'botkit';
import { Answer, EntityAnalysis, IntentAnalysis, NlpjsEngine } from 'botbuilder-nlpjs';

export class BotService {
  private readonly _adapter: BotAdapter;
  private readonly _storage: Storage;
  private readonly _modulePaths: string[];

  /**
   * Construct the service with adapter, storage and module directories. To load particular handlers for
   * different bot connectors use a module path to load them. For example to load additional web servers for
   * Slack authentication.
   *
   * @param adapter The adapter
   * @param storage The storage, if null will use Memory storage
   * @param modulePaths The paths of any modules to load.
   */
  constructor(adapter: BotAdapter, storage: Storage, modulePaths: string[]) {
    this._storage = storage;
    this._adapter = adapter;
    adapter.onTurnError = this.onTurnError;
    this._modulePaths = modulePaths;
  }

  /**
   * Start the bot with the NLP Engine.
   *
   * @param nlpSettings NLPjs settings. See the settings object here: https://github.com/axa-group/nlp.js/blob/master/docs/v3/nlp-manager.md
   * @param nlpModelPath The absolute path to the model file for the NLP.
   */
  public async start(nlpSettings: any, nlpModelPath: string): Promise<any> {
    NlpjsEngine.build(nlpSettings, nlpModelPath).then(nlpEngine => {
      this._adapter.use(new Answer(nlpEngine));
      this._adapter.use(new IntentAnalysis(nlpEngine));
      this._adapter.use(new EntityAnalysis(nlpEngine));

      const controller = new Botkit({
        webhook_uri: '/api/messages',
        adapter: this._adapter,
        storage: this._storage,
      });

      controller.ready(async () => {
        // Load the dialogue handlers.
        this._modulePaths.forEach(modulePath => {
          controller.loadModules(path.join(__dirname, modulePath));
        });
      });
    });
  }

  protected async onTurnError(context, error) {
    console.error(`\n [onTurnError] unhandled error: ${error}`);

    await context.sendTraceActivity(
      'OnTurnError Trace',
      `${error}`,
      'https://www.botframework.com/schemas/error',
      'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
  }
}
