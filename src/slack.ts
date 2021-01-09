import { BotService } from './BotService';
import { adapter } from './adapters/slack-adapter';

const service = new BotService(adapter, null, ['dialogues/', 'services/slack']);
service.start({ languages: ['en'], forceNER: true }, process.env.MODEL).catch(e => console.log(e));
