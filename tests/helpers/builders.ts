import { Equipment, Sample, Technician } from '../../src/types';

export function buildSample(overrides: Partial<Sample> = {}): Sample {
  return {
    id: 'S001',
    type: 'BLOOD',
    priority: 'ROUTINE',
    analysisTime: 30,
    arrivalTime: '09:00',
    patientId: 'P001',
    ...overrides,
  };
}

export function buildTechnician(overrides: Partial<Technician> = {}): Technician {
  return { id: 'T001', speciality: 'BLOOD', startTime: '08:00', endTime: '17:00', ...overrides };
}

export function buildEquipment(overrides: Partial<Equipment> = {}): Equipment {
  return { id: 'E001', type: 'BLOOD', available: true, ...overrides };
}