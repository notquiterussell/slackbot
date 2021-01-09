import { BotService } from './BotService';
import { adapter } from './adapters/microsoft-adapter';

const service = new BotService(adapter, null, ['dialogues/', 'services/microsoft']);
service.start({ languages: ['en'], forceNER: true }, process.env.MODEL).catch(e => console.log(e));
