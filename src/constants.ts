import { Priority } from './types';

export const GENERAL_SPECIALITY = 'GENERAL';

export const PRIORITY_RANK: Record<Priority, number> = {
  STAT: 0,
  URGENT: 1,
  ROUTINE: 2,
};