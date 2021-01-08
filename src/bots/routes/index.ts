import { BotRouter } from '../../routing/botRouter';
import { smalltalk } from './smalltalk';
import { qna } from './qna';
import { welcome } from './welcome';
import { actions } from './actions';

export const router = new BotRouter();

smalltalk(router);
qna(router);
welcome(router);
actions(router);
