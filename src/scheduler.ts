import { ResourceAvailability } from './availability';
import { findEarliestSlot, Slot } from './slotSelection';
import { sortSamplesByPriority } from './sorting';
import { formatTime } from './time';
import { LabData, Sample, ScheduleEntry } from './types';

export interface Assignment extends Slot {
  sample: Sample;
}

export interface SchedulingResult {
  assignments: Assignment[];
  unscheduled: Sample[];
}

export function planSamples(data: LabData): SchedulingResult {
  const availability = new ResourceAvailability(data.technicians, data.equipment);
  const assignments: Assignment[] = [];
  const unscheduled: Sample[] = [];

  for (const sample of sortSamplesByPriority(data.samples)) {
    const slot = findEarliestSlot(sample, data.technicians, data.equipment, availability);
    if (!slot) {
      unscheduled.push(sample);
      continue;
    }
    availability.reserve(slot.technician.id, slot.equipment.id, slot.end);
    assignments.push({ ...slot, sample });
  }

  return { assignments, unscheduled };
}

export function toScheduleEntry({ sample, technician, equipment, start, end }: Assignment): ScheduleEntry {
  return {
    sampleId: sample.id,
    technicianId: technician.id,
    equipmentId: equipment.id,
    startTime: formatTime(start),
    endTime: formatTime(end),
    priority: sample.priority,
  };
}
