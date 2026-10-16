import { parseTime } from './time';
import { Equipment, Technician } from './types';

const MIDNIGHT = 0;

export class ResourceAvailability {
  private readonly technicianFreeAt = new Map<string, number>();
  private readonly equipmentFreeAt = new Map<string, number>();

  constructor(technicians: readonly Technician[], equipment: readonly Equipment[]) {
    technicians.forEach((technician) => {
      this.technicianFreeAt.set(technician.id, parseTime(technician.startTime));
    });
    equipment.forEach((item) => {
      this.equipmentFreeAt.set(item.id, MIDNIGHT);
    });
  }

  getTechnicianFreeAt(technicianId: string): number {
    return this.read(this.technicianFreeAt, technicianId, 'technician');
  }

  getEquipmentFreeAt(equipmentId: string): number {
    return this.read(this.equipmentFreeAt, equipmentId, 'equipment');
  }

  reserve(technicianId: string, equipmentId: string, endMinutes: number): void {
    this.technicianFreeAt.set(technicianId, endMinutes);
    this.equipmentFreeAt.set(equipmentId, endMinutes);
  }

  private read(freeAtById: Map<string, number>, id: string, kind: string): number {
    const freeAt = freeAtById.get(id);
    if (freeAt === undefined) {
      throw new Error(`Unknown ${kind} "${id}"`);
    }
    return freeAt;
  }
}