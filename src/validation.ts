import { isEquipmentCompatible, isTechnicianCompatible } from './compatibility';
import { PRIORITY_RANK } from './constants';
import { Assignment, SchedulingResult } from './scheduler';
import { parseTime } from './time';

export type ViolationRule =
  | 'INCOMPATIBLE_TECHNICIAN'
  | 'INCOMPATIBLE_EQUIPMENT'
  | 'UNAVAILABLE_EQUIPMENT'
  | 'OUTSIDE_SHIFT'
  | 'INVALID_TIME_RANGE'
  | 'RESOURCE_OVERLAP'
  | 'PRIORITY_INVERSION';

export interface Violation {
  rule: ViolationRule;
  sampleIds: string[];
}

function isOutsideShift({ technician, start, end }: Assignment): boolean {
  return start < parseTime(technician.startTime) || end > parseTime(technician.endTime);
}

function sharesResource(a: Assignment, b: Assignment): boolean {
  return a.technician.id === b.technician.id || a.equipment.id === b.equipment.id;
}

function overlaps(a: Assignment, b: Assignment): boolean {
  return a.start < b.end && b.start < a.end;
}

function isPriorityInversion(a: Assignment, b: Assignment): boolean {
  const rankA = PRIORITY_RANK[a.sample.priority];
  const rankB = PRIORITY_RANK[b.sample.priority];
  if (rankA === rankB || !sharesResource(a, b)) {
    return false;
  }
  const [higher, lower] = rankA < rankB ? [a, b] : [b, a];
  return lower.start < higher.start;
}

const SINGLE_CHECKS: Array<[ViolationRule, (assignment: Assignment) => boolean]> = [
  ['INCOMPATIBLE_TECHNICIAN', (a) => !isTechnicianCompatible(a.technician, a.sample)],
  ['INCOMPATIBLE_EQUIPMENT', (a) => !isEquipmentCompatible(a.equipment, a.sample)],
  ['UNAVAILABLE_EQUIPMENT', (a) => !a.equipment.available],
  ['OUTSIDE_SHIFT', isOutsideShift],
  ['INVALID_TIME_RANGE', (a) => a.start >= a.end],
];

const PAIR_CHECKS: Array<[ViolationRule, (a: Assignment, b: Assignment) => boolean]> = [
  ['RESOURCE_OVERLAP', (a, b) => sharesResource(a, b) && overlaps(a, b)],
  ['PRIORITY_INVERSION', isPriorityInversion],
];

function findSingleViolations(assignment: Assignment): Violation[] {
  return SINGLE_CHECKS.filter(([, isViolated]) => isViolated(assignment)).map(([rule]) => ({
    rule,
    sampleIds: [assignment.sample.id],
  }));
}

function findPairViolations(a: Assignment, b: Assignment): Violation[] {
  return PAIR_CHECKS.filter(([, isViolated]) => isViolated(a, b)).map(([rule]) => ({
    rule,
    sampleIds: [a.sample.id, b.sample.id],
  }));
}

export function findScheduleViolations(assignments: readonly Assignment[]): Violation[] {
  const violations = assignments.flatMap(findSingleViolations);
  for (let i = 0; i < assignments.length; i++) {
    for (let j = i + 1; j < assignments.length; j++) {
      violations.push(...findPairViolations(assignments[i], assignments[j]));
    }
  }
  return violations;
}

export function countConflicts(result: SchedulingResult): number {
  return findScheduleViolations(result.assignments).length + result.unscheduled.length;
}
