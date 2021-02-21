export type Resolution = {
  type: string;
  date?: Date;
  timex?: string;
};

export type Entity = {
  start: number;
  end: number;
  entity: string;
  type: string;
  option: string;
  sourceText: string;
  utteranceText: string;
  resolution?: Resolution;
};

export const convert = (entity: Entity): void => {};
