import { BotService } from './BotService';
import { adapter } from './adapters/microsoft-adapter';
import { MongoDbStorage } from '@botbuildercommunity/storage-mongodb';
import { Storage, UserState } from 'botbuilder';

const storage: Storage = new MongoDbStorage('mongodb://localhost:27017/', 'helperby', 'conversationState');

const service = new BotService(adapter, storage, ['dialogues/', 'services/microsoft']);
service.start({ languages: ['en'], forceNER: true }, process.env.MODEL).catch(e => console.log(e));
