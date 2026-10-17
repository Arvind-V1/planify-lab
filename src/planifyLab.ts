import { PRIORITY_RANK } from './constants';
import { assertValidLabData } from './inputValidation';
import { computeMetrics } from './metrics';
import { Assignment, planSamples, toScheduleEntry } from './scheduler';
import { compareText } from './sorting';
import { LabData, LabPlan } from './types';

function compareChronologically(a: Assignment, b: Assignment): number {
  return (
    a.start - b.start ||
    PRIORITY_RANK[a.sample.priority] - PRIORITY_RANK[b.sample.priority] ||
    compareText(a.sample.id, b.sample.id)
  );
}

export function planifyLab(data: LabData): LabPlan {
  assertValidLabData(data);

  const result = planSamples(data);
  const schedule = [...result.assignments].sort(compareChronologically).map(toScheduleEntry);

  return { schedule, metrics: computeMetrics(result) };
}