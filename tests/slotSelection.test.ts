import { ResourceAvailability } from '../src/availability';
import { findEarliestSlot } from '../src/slotSelection';
import { parseTime } from '../src/time';
import { Equipment, Technician } from '../src/types';
import { buildEquipment, buildSample, buildTechnician } from './helpers/builders';

const TEN_AM = parseTime('10:00');

function slotFor(
  technicians: Technician[],
  equipment: Equipment[],
  sampleOverrides = {},
  prepare: (availability: ResourceAvailability) => void = () => undefined,
) {
  const availability = new ResourceAvailability(technicians, equipment);
  prepare(availability);
  return findEarliestSlot(buildSample(sampleOverrides), technicians, equipment, availability);
}

describe('findEarliestSlot', () => {
  it("démarre à l'arrivée quand tout est libre", () => {
    const slot = slotFor([buildTechnician()], [buildEquipment()], { arrivalTime: '09:00', analysisTime: 30 });

    expect(slot).toMatchObject({ start: 540, end: 570 });
  });

  it('attend que le technicien se libère', () => {
    const slot = slotFor(
      [buildTechnician({ id: 'T1' })],
      [buildEquipment({ id: 'E1' }), buildEquipment({ id: 'E2' })],
      { arrivalTime: '09:00' },
      (availability) => availability.reserve('T1', 'E2', TEN_AM),
    );

    expect(slot?.start).toBe(TEN_AM);
  });

  it("attend que l'équipement se libère", () => {
    const slot = slotFor(
      [buildTechnician({ id: 'T1' }), buildTechnician({ id: 'T2', speciality: 'URINE' })],
      [buildEquipment({ id: 'E1' })],
      { arrivalTime: '09:00' },
      (availability) => availability.reserve('T2', 'E1', TEN_AM),
    );

    expect(slot?.start).toBe(TEN_AM);
  });

  it('attend le plus tardif des deux', () => {
    const slot = slotFor(
      [buildTechnician({ id: 'T1' }), buildTechnician({ id: 'T2', speciality: 'URINE' })],
      [buildEquipment({ id: 'E1' }), buildEquipment({ id: 'E2', type: 'URINE' })],
      { arrivalTime: '09:00' },
      (availability) => {
        availability.reserve('T1', 'E2', TEN_AM);
        availability.reserve('T2', 'E1', parseTime('10:30'));
      },
    );

    expect(slot?.start).toBe(parseTime('10:30'));
  });

  it('ne démarre pas avant le début de service du technicien', () => {
    const slot = slotFor([buildTechnician({ startTime: '08:00' })], [buildEquipment()], {
      arrivalTime: '07:00',
    });

    expect(slot?.start).toBe(parseTime('08:00'));
  });

  it('accepte une analyse qui se termine pile à la fin de service', () => {
    const slot = slotFor([buildTechnician({ endTime: '17:00' })], [buildEquipment()], {
      arrivalTime: '16:30',
      analysisTime: 30,
    });

    expect(slot?.end).toBe(parseTime('17:00'));
  });

  it('refuse une analyse qui dépasse la fin de service', () => {
    const slot = slotFor([buildTechnician({ endTime: '09:30' })], [buildEquipment()], {
      arrivalTime: '09:00',
      analysisTime: 60,
    });

    expect(slot).toBeUndefined();
  });

  it('retourne undefined sans équipement compatible', () => {
    const slot = slotFor([buildTechnician()], [buildEquipment({ type: 'URINE' })], { type: 'BLOOD' });

    expect(slot).toBeUndefined();
  });

  it('préfère le début le plus tôt, même avec un technicien GENERAL', () => {
    const slot = slotFor(
      [
        buildTechnician({ id: 'T1', speciality: 'BLOOD' }),
        buildTechnician({ id: 'T2', speciality: 'GENERAL' }),
      ],
      [buildEquipment({ id: 'E1' }), buildEquipment({ id: 'E2', type: 'URINE' })],
      { arrivalTime: '09:00' },
      (availability) => availability.reserve('T1', 'E2', TEN_AM),
    );

    expect(slot?.technician.id).toBe('T2');
  });

  it('préfère le spécialiste au GENERAL à début égal', () => {
    const slot = slotFor(
      [
        buildTechnician({ id: 'T2', speciality: 'GENERAL' }),
        buildTechnician({ id: 'T1', speciality: 'BLOOD' }),
      ],
      [buildEquipment()],
    );

    expect(slot?.technician.id).toBe('T1');
  });

  it("garde l'ordre des listes à égalité parfaite", () => {
    const slot = slotFor(
      [buildTechnician({ id: 'T1' }), buildTechnician({ id: 'T2' })],
      [buildEquipment({ id: 'E1' }), buildEquipment({ id: 'E2' })],
    );

    expect(slot?.technician.id).toBe('T1');
    expect(slot?.equipment.id).toBe('E1');
  });
});
