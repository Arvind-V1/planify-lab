import { PRIORITY_RANK } from './constants';
import { parseTime } from './time';
import { Sample } from './types';

export function  compareText(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  return a > b ? 1 : 0;
}

function compareSamples(a: Sample, b: Sample): number {
  return (
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
    parseTime(a.arrivalTime) - parseTime(b.arrivalTime) ||
    compareText(a.id, b.id)
  );
}

export function sortSamplesByPriority(samples: readonly Sample[]): Sample[] {
  return [...samples].sort(compareSamples);
}