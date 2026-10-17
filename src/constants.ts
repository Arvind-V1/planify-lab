import { Priority, SampleType, TechnicianSpeciality } from './types';

export const GENERAL_SPECIALITY = 'GENERAL';

export const PRIORITY_RANK: Record<Priority, number> = {
  STAT: 0,
  URGENT: 1,
  ROUTINE: 2,
};

export const PRIORITIES = Object.keys(PRIORITY_RANK) as Priority[];
export const SAMPLE_TYPES: readonly SampleType[] = ['BLOOD', 'URINE', 'TISSUE'];
export const SPECIALITIES: readonly TechnicianSpeciality[] = [...SAMPLE_TYPES, GENERAL_SPECIALITY];
