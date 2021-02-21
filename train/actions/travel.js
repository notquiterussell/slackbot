/**
 * @param manager {NlpManager} NLP manager
 * @returns {Promise<void>}
 */
const process = manager => {
  const RAIL_INTENT = 'action/travel.train';

  const fromEntity = manager.addTrimEntity('fromCity');
  fromEntity.addBetweenCondition('en', ['from'], ['to', 'on']);
  fromEntity.addAfterLastCondition('en', 'from');
  const toEntity = manager.addTrimEntity('toCity');
  toEntity.addBetweenCondition('en', 'to', ['from', 'on'], { skip: [RAIL_INTENT] });
  toEntity.addAfterLastCondition('en', 'to');

  manager.addTrimEntity('travelDate');

  manager.slotManager.addSlot(RAIL_INTENT, 'toCity', false, { en: '' });
  manager.slotManager.addSlot(RAIL_INTENT, 'fromCity', false, { en: '' });
  manager.slotManager.addSlot(RAIL_INTENT, 'travelDate', false, { en: '' });

  manager.addDocument('en', 'I want a train from %fromCity% to %toCity% %travelDate%', RAIL_INTENT);
  manager.addDocument('en', 'I want a train from %fromCity% on %travelDate%', RAIL_INTENT);
  manager.addDocument('en', 'I want a train from %fromCity% %travelDate%', RAIL_INTENT);
};

module.exports = process;
