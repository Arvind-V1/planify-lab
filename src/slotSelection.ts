import { ResourceAvailability } from './availability';
import { findCompatibleEquipment, findCompatibleTechnicians } from './compatibility';
import { GENERAL_SPECIALITY } from './constants';
import { parseTime } from './time';
import { Equipment, Sample, Technician } from './types';

export interface Slot {
  technician: Technician;
  equipment: Equipment;
  start: number;
  end: number;
}

function buildSlot(
  sample: Sample,
  technician: Technician,
  equipment: Equipment,
  availability: ResourceAvailability,
): Slot | undefined {
  const start = Math.max(
    parseTime(sample.arrivalTime),
    availability.getTechnicianFreeAt(technician.id),
    availability.getEquipmentFreeAt(equipment.id),
  );
  const end = start + sample.analysisTime;
  const endsWithinShift = end <= parseTime(technician.endTime);
  return endsWithinShift ? { technician, equipment, start, end } : undefined;
}

function specialistRank(technician: Technician): number {
  return technician.speciality === GENERAL_SPECIALITY ? 1 : 0;
}

function isBetterSlot(candidate: Slot, current: Slot): boolean {
  if (candidate.start !== current.start) {
    return candidate.start < current.start;
  }
  return specialistRank(candidate.technician) < specialistRank(current.technician);
}

export function findEarliestSlot(
  sample: Sample,
  technicians: readonly Technician[],
  equipment: readonly Equipment[],
  availability: ResourceAvailability,
): Slot | undefined {
  const compatibleEquipment = findCompatibleEquipment(sample, equipment);
  let best: Slot | undefined;

  for (const technician of findCompatibleTechnicians(sample, technicians)) {
    for (const item of compatibleEquipment) {
      const candidate = buildSlot(sample, technician, item, availability);
      if (candidate && (!best || isBetterSlot(candidate, best))) {
        best = candidate;
      }
    }
  }
  return best;
}