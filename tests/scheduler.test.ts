import { planSamples, toScheduleEntry } from '../src/scheduler';
import { EXAMPLE_1, EXAMPLE_2, EXAMPLE_3 } from './fixtures/examples';
import { buildEquipment, buildSample, buildTechnician } from './helpers/builders';

describe('planSamples : exemples du sujet', () => {
  it.each([
    ['exemple 1 (un échantillon)', EXAMPLE_1],
    ['exemple 2 (STAT avant URGENT)', EXAMPLE_2],
    ['exemple 3 (parallélisme)', EXAMPLE_3],
  ])('%s', (_name, example) => {
    const { assignments, unscheduled } = planSamples(example.input);

    expect(assignments.map((assignment) => toScheduleEntry(assignment))).toEqual(example.schedule);
    expect(unscheduled).toEqual([]);
  });
});

describe('planSamples : cas particuliers', () => {
  it('retourne un résultat vide sans échantillon', () => {
    const result = planSamples({ samples: [], technicians: [buildTechnician()], equipment: [buildEquipment()] });

    expect(result).toEqual({ assignments: [], unscheduled: [] });
  });

  it('signale un échantillon qu\'aucun équipement ne peut traiter', () => {
    const tissue = buildSample({ id: 'S1', type: 'TISSUE' });

    const result = planSamples({
      samples: [tissue],
      technicians: [buildTechnician({ speciality: 'GENERAL' })],
      equipment: [buildEquipment({ type: 'BLOOD' })],
    });

    expect(result.assignments).toEqual([]);
    expect(result.unscheduled).toEqual([tissue]);
  });

  it('n\'utilise pas un équipement indisponible', () => {
    const result = planSamples({
      samples: [buildSample()],
      technicians: [buildTechnician()],
      equipment: [buildEquipment({ available: false })],
    });

    expect(result.assignments).toEqual([]);
    expect(result.unscheduled).toHaveLength(1);
  });

  it('retarde un ROUTINE ancien derrière un STAT tardif sur la même ressource', () => {
    const result = planSamples({
      samples: [
        buildSample({ id: 'R', priority: 'ROUTINE', arrivalTime: '08:00', analysisTime: 30 }),
        buildSample({ id: 'S', priority: 'STAT', arrivalTime: '16:00', analysisTime: 30 }),
      ],
      technicians: [buildTechnician({ endTime: '17:00' })],
      equipment: [buildEquipment()],
    });

    const timeline = result.assignments.map((a) => [a.sample.id, toScheduleEntry(a).startTime]);
    expect(timeline).toEqual([['S', '16:00'], ['R', '16:30']]);
  });

  it('ne planifie jamais deux analyses simultanées sur la même ressource', () => {
    const samples = Array.from({ length: 6 }, (_, index) =>
      buildSample({ id: `S${index}`, arrivalTime: '09:00', analysisTime: 20 }),
    );

    const { assignments } = planSamples({
      samples,
      technicians: [buildTechnician({ id: 'T1' }), buildTechnician({ id: 'T2' })],
      equipment: [buildEquipment({ id: 'E1' }), buildEquipment({ id: 'E2' })],
    });

    const overlaps = (a: (typeof assignments)[number], b: (typeof assignments)[number]) =>
      a.start < b.end && b.start < a.end;
    for (const a of assignments) {
      for (const b of assignments.filter((other) => other !== a)) {
        const sharesResource = a.technician.id === b.technician.id || a.equipment.id === b.equipment.id;
        expect(sharesResource && overlaps(a, b)).toBe(false);
      }
    }
  });
});