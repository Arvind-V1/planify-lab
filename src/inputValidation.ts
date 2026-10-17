import { PRIORITIES, SAMPLE_TYPES, SPECIALITIES } from './constants';
import { isValidTime, parseTime } from './time';
import { Equipment, LabData, Sample, Technician } from './types';

const COLLECTION_KEYS = ['samples', 'technicians', 'equipment'] as const;

export class InvalidLabDataError extends Error {
  constructor(public readonly problems: readonly string[]) {
    super(`Invalid lab data:\n- ${problems.join('\n- ')}`);
    this.name = 'InvalidLabDataError';
  }
}

function findDuplicateIds(items: readonly { id: string }[], kind: string): string[] {
  const seen = new Set<string>();
  const problems: string[] = [];
  for (const { id } of items) {
    if (seen.has(id)) {
      problems.push(`${kind} "${id}": duplicate id`);
    }
    seen.add(id);
  }
  return problems;
}

function validateSample(sample: Sample): string[] {
  const label = `sample "${sample.id}"`;
  const problems: string[] = [];
  if (!SAMPLE_TYPES.includes(sample.type)) {
    problems.push(`${label}: unknown type "${sample.type}"`);
  }
  if (!PRIORITIES.includes(sample.priority)) {
    problems.push(`${label}: unknown priority "${sample.priority}"`);
  }
  if (!Number.isInteger(sample.analysisTime) || sample.analysisTime <= 0) {
    problems.push(`${label}: analysisTime must be a positive integer (minutes), got ${sample.analysisTime}`);
  }
  if (!isValidTime(sample.arrivalTime)) {
    problems.push(`${label}: invalid arrivalTime "${sample.arrivalTime}" (expected HH:MM)`);
  }
  return problems;
}

function validateTechnician(technician: Technician): string[] {
  const label = `technician "${technician.id}"`;
  const problems: string[] = [];
  if (!SPECIALITIES.includes(technician.speciality)) {
    problems.push(`${label}: unknown speciality "${technician.speciality}"`);
  }
  const hasValidStart = isValidTime(technician.startTime);
  const hasValidEnd = isValidTime(technician.endTime);
  if (!hasValidStart) {
    problems.push(`${label}: invalid startTime "${technician.startTime}" (expected HH:MM)`);
  }
  if (!hasValidEnd) {
    problems.push(`${label}: invalid endTime "${technician.endTime}" (expected HH:MM)`);
  }
  if (hasValidStart && hasValidEnd && parseTime(technician.endTime) <= parseTime(technician.startTime)) {
    problems.push(`${label}: endTime must be after startTime`);
  }
  return problems;
}

function validateEquipment(equipment: Equipment): string[] {
  const label = `equipment "${equipment.id}"`;
  const problems: string[] = [];
  if (!SAMPLE_TYPES.includes(equipment.type)) {
    problems.push(`${label}: unknown type "${equipment.type}"`);
  }
  if (typeof equipment.available !== 'boolean') {
    problems.push(`${label}: available must be a boolean`);
  }
  return problems;
}

export function findInputProblems(data: LabData): string[] {
  const structureProblems = COLLECTION_KEYS.filter((key) => !Array.isArray(data?.[key])).map(
    (key) => `${key} must be an array`,
  );
  if (structureProblems.length > 0) {
    return structureProblems;
  }
  return [
    ...findDuplicateIds(data.samples, 'sample'),
    ...findDuplicateIds(data.technicians, 'technician'),
    ...findDuplicateIds(data.equipment, 'equipment'),
    ...data.samples.flatMap(validateSample),
    ...data.technicians.flatMap(validateTechnician),
    ...data.equipment.flatMap(validateEquipment),
  ];
}

export function assertValidLabData(data: LabData): void {
  const problems = findInputProblems(data);
  if (problems.length > 0) {
    throw new InvalidLabDataError(problems);
  }
}