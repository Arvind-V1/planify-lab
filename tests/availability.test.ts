import { ResourceAvailability } from '../src/availability';
import { buildEquipment, buildTechnician } from './helpers/builders';

function buildAvailability(): ResourceAvailability {
  return new ResourceAvailability(
    [buildTechnician({ id: 'T1', startTime: '08:00' }), buildTechnician({ id: 'T2', startTime: '10:30' })],
    [buildEquipment({ id: 'E1' })],
  );
}

describe('ResourceAvailability', () => {
  it('libère un technicien dès son début de service', () => {
    const availability = buildAvailability();

    expect(availability.getTechnicianFreeAt('T1')).toBe(480);
    expect(availability.getTechnicianFreeAt('T2')).toBe(630);
  });

  it('libère un équipement dès minuit', () => {
    expect(buildAvailability().getEquipmentFreeAt('E1')).toBe(0);
  });

  it("bloque le technicien et l'équipement jusqu'à la fin de la réservation", () => {
    const availability = buildAvailability();

    availability.reserve('T1', 'E1', 600);

    expect(availability.getTechnicianFreeAt('T1')).toBe(600);
    expect(availability.getEquipmentFreeAt('E1')).toBe(600);
    expect(availability.getTechnicianFreeAt('T2')).toBe(630);
  });

  it('refuse une ressource inconnue', () => {
    const availability = buildAvailability();

    expect(() => availability.getTechnicianFreeAt('T9')).toThrow('Unknown technician "T9"');
    expect(() => availability.getEquipmentFreeAt('E9')).toThrow('Unknown equipment "E9"');
  });
});
