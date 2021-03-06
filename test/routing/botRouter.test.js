const { BotRouter } = require('../../lib/routing/botRouter');

describe('Routing tests', () => {
  it('should allow adding an action with a wildcard', () => {
    const router = new BotRouter();

    router.if('other/.*', (intent, context) => {});
    router.if('smalltalk/.*', myFunction);

    async function myFunction(intent, context) {
      context.pass = true;
      return Promise.resolve();
    }

    expect(router.match({ intent: 'qna/greeting.salutation' })).toBeUndefined();

    const actual = router.match({ intent: 'smalltalk/greeting.salutation' });
    expect(actual).toBeInstanceOf(Function);
    const context = { pass: false };
    actual({ intent: 'smalltalk/greeting.salutation' }, context);

    expect(context.pass).toBeTruthy();
  });

  it('should reject overlapping patterns', () => {
    const router = new BotRouter();

    router.if('smalltalk/.*', (intent, context) => {});

    try {
      router.if('smalltalk/greetings.salutation', (intent, context) => {});
      fail('Should have rejected the additional pattern');
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toEqual(
        'The intent smalltalk/greetings.salutation has already been registered as /^smalltalk\\/.*$/'
      );
    }
  });

  it('should allow near patterns', () => {
    const router = new BotRouter();

    router.if('smalltalk/greeting.welcome', (intent, context) => {
      context.short = true;
      context.long = false;
    });
    router.if('smalltalk/greeting.welcome.near', (intent, context) => {
      context.short = false;
      context.long = true;
    });

    expect(router.match({ intent: 'smalltalk/greeting.welcome' })).toBeInstanceOf(Function);
    expect(router.match({ intent: 'smalltalk/greeting.welcome.near' })).toBeInstanceOf(Function);

    const context = {};
    router.match({ intent: 'smalltalk/greeting.welcome' })({}, context);
    expect(context.short).toBeTruthy();
    expect(context.long).toBeFalsy();
    router.match({ intent: 'smalltalk/greeting.welcome.near' })({}, context);
    expect(context.short).toBeFalsy();
    expect(context.long).toBeTruthy();
  });
});
