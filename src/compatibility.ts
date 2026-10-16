import { GENERAL_SPECIALITY } from './constants';
import { Equipment, Sample, Technician } from './types';

/** Un technicien GENERAL peut tout traiter ; un spécialiste uniquement son type. */
export function isTechnicianCompatible(technician: Technician, sample: Sample): boolean {
  return technician.speciality === GENERAL_SPECIALITY || technician.speciality === sample.type;
}

/** Chaque équipement est spécialisé : il n'y a pas d'équivalent de GENERAL. */
export function isEquipmentCompatible(equipment: Equipment, sample: Sample): boolean {
  return equipment.type === sample.type;
}

export function findCompatibleTechnicians(sample: Sample, technicians: readonly Technician[]): Technician[] {
  return technicians.filter((technician) => isTechnicianCompatible(technician, sample));
}

/** Les équipements indisponibles au départ ne sont jamais proposés. */
export function findCompatibleEquipment(sample: Sample, equipment: readonly Equipment[]): Equipment[] {
  return equipment.filter((item) => item.available && isEquipmentCompatible(item, sample));
}