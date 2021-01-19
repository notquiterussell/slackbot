import { BotService } from './BotService';
import { adapter } from './adapters/slack-adapter';
import { Storage } from 'botbuilder';
import { MongoDbStorage } from '@botbuildercommunity/storage-mongodb';

const storage: Storage = new MongoDbStorage('mongodb://localhost:27017/', 'helperby', 'conversationState');

const service = new BotService(adapter, storage, ['dialogues/', 'services/slack']);
service.start({ languages: ['en'], forceNER: true }, process.env.MODEL).catch(e => console.log(e));
