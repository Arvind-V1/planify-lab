import { Assignment, SchedulingResult } from './scheduler';
import { parseTime } from './time';
import { Metrics } from './types';
import { countConflicts } from './validation';

const PERCENT = 100;
const ONE_DECIMAL = 10;

function roundToOneDecimal(value: number): number {
  return Math.round(value * ONE_DECIMAL) / ONE_DECIMAL;
}

export function calculateTotalTime(assignments: readonly Assignment[]): number {
  if (assignments.length === 0) {
    return 0;
  }
  const firstArrival = Math.min(...assignments.map(({ sample }) => parseTime(sample.arrivalTime)));
  const lastEnd = Math.max(...assignments.map(({ end }) => end));
  return lastEnd - firstArrival;
}

export function calculateEfficiency(assignments: readonly Assignment[], totalTime: number): number {
  if (totalTime <= 0) {
    return 0;
  }
  const analysisMinutes = assignments.reduce((sum, { sample }) => sum + sample.analysisTime, 0);
  return roundToOneDecimal((analysisMinutes / totalTime) * PERCENT);
}

export function computeMetrics(result: SchedulingResult): Metrics {
  const totalTime = calculateTotalTime(result.assignments);
  return {
    totalTime,
    efficiency: calculateEfficiency(result.assignments, totalTime),
    conflicts: countConflicts(result),
  };
}