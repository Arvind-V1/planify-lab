import { Assignment, planSamples } from '../src/scheduler';
import { countConflicts, findScheduleViolations, ViolationRule } from '../src/validation';
import { EXAMPLE_1, EXAMPLE_2, EXAMPLE_3 } from './fixtures/examples';
import { buildAssignment, buildEquipment, buildSample, buildTechnician } from './helpers/builders';

function rulesOf(assignments: Assignment[]): ViolationRule[] {
  return findScheduleViolations(assignments).map((violation) => violation.rule);
}

describe("findScheduleViolations : plannings produits par l'algorithme", () => {
  it.each([
    ['exemple 1', EXAMPLE_1],
    ['exemple 2', EXAMPLE_2],
    ['exemple 3', EXAMPLE_3],
  ])("ne détecte rien sur l'%s", (_name, example) => {
    expect(findScheduleViolations(planSamples(example.input).assignments)).toEqual([]);
  });

  it('ne détecte aucun conflit sur un scénario varié', () => {
    const result = planSamples({
      samples: [
        buildSample({ id: 'S1', type: 'BLOOD', priority: 'STAT', arrivalTime: '09:00', analysisTime: 45 }),
        buildSample({ id: 'S2', type: 'URINE', priority: 'URGENT', arrivalTime: '09:10', analysisTime: 30 }),
        buildSample({
          id: 'S3',
          type: 'TISSUE',
          priority: 'ROUTINE',
          arrivalTime: '08:30',
          analysisTime: 60,
        }),
        buildSample({ id: 'S4', type: 'URINE', priority: 'STAT', arrivalTime: '09:20', analysisTime: 20 }),
        buildSample({ id: 'S5', type: 'BLOOD', priority: 'ROUTINE', arrivalTime: '08:00', analysisTime: 30 }),
        buildSample({ id: 'S6', type: 'BLOOD', priority: 'URGENT', arrivalTime: '10:00', analysisTime: 40 }),
        buildSample({ id: 'S7', type: 'URINE', priority: 'ROUTINE', arrivalTime: '09:00', analysisTime: 25 }),
        buildSample({ id: 'S8', type: 'TISSUE', priority: 'STAT', arrivalTime: '11:00', analysisTime: 30 }),
      ],
      technicians: [
        buildTechnician({ id: 'T1', speciality: 'BLOOD' }),
        buildTechnician({ id: 'T2', speciality: 'URINE' }),
        buildTechnician({ id: 'T3', speciality: 'GENERAL', startTime: '09:00', endTime: '13:00' }),
      ],
      equipment: [
        buildEquipment({ id: 'E1', type: 'BLOOD' }),
        buildEquipment({ id: 'E2', type: 'URINE' }),
        buildEquipment({ id: 'E3', type: 'TISSUE' }),
        buildEquipment({ id: 'E4', type: 'BLOOD' }),
      ],
    });

    expect(countConflicts(result)).toBe(0);
  });
});

describe('findScheduleViolations : affectations invalides', () => {
  it('détecte un technicien incompatible', () => {
    const assignment = buildAssignment({ technician: buildTechnician({ speciality: 'URINE' }) });

    expect(rulesOf([assignment])).toEqual(['INCOMPATIBLE_TECHNICIAN']);
  });

  it('détecte un équipement incompatible', () => {
    const assignment = buildAssignment({ equipment: buildEquipment({ type: 'URINE' }) });

    expect(rulesOf([assignment])).toEqual(['INCOMPATIBLE_EQUIPMENT']);
  });

  it('détecte un équipement indisponible', () => {
    const assignment = buildAssignment({ equipment: buildEquipment({ available: false }) });

    expect(rulesOf([assignment])).toEqual(['UNAVAILABLE_EQUIPMENT']);
  });

  it('détecte une analyse avant le début de service', () => {
    expect(rulesOf([buildAssignment({ start: 420, end: 450 })])).toEqual(['OUTSIDE_SHIFT']);
  });

  it('détecte une analyse qui finit après la fin de service', () => {
    expect(rulesOf([buildAssignment({ start: 1000, end: 1030 })])).toEqual(['OUTSIDE_SHIFT']);
  });

  it('détecte une analyse qui se termine avant de commencer', () => {
    expect(rulesOf([buildAssignment({ start: 600, end: 600 })])).toEqual(['INVALID_TIME_RANGE']);
  });
});

describe('findScheduleViolations : chevauchements', () => {
  const first = { sample: buildSample({ id: 'S1' }), start: 540, end: 600 };

  it('détecte deux analyses simultanées sur le même technicien', () => {
    const a = buildAssignment({
      ...first,
      technician: buildTechnician({ id: 'T1' }),
      equipment: buildEquipment({ id: 'E1' }),
    });
    const b = buildAssignment({
      sample: buildSample({ id: 'S2' }),
      technician: buildTechnician({ id: 'T1' }),
      equipment: buildEquipment({ id: 'E2' }),
      start: 570,
      end: 630,
    });

    expect(rulesOf([a, b])).toEqual(['RESOURCE_OVERLAP']);
  });

  it('détecte deux analyses simultanées sur le même équipement', () => {
    const a = buildAssignment({
      ...first,
      technician: buildTechnician({ id: 'T1' }),
      equipment: buildEquipment({ id: 'E1' }),
    });
    const b = buildAssignment({
      sample: buildSample({ id: 'S2' }),
      technician: buildTechnician({ id: 'T2' }),
      equipment: buildEquipment({ id: 'E1' }),
      start: 570,
      end: 630,
    });

    expect(rulesOf([a, b])).toEqual(['RESOURCE_OVERLAP']);
  });

  it('accepte deux analyses consécutives sur la même ressource', () => {
    const a = buildAssignment(first);
    const b = buildAssignment({ sample: buildSample({ id: 'S2' }), start: 600, end: 660 });

    expect(rulesOf([a, b])).toEqual([]);
  });

  it('accepte deux analyses simultanées sur des ressources différentes', () => {
    const a = buildAssignment({
      ...first,
      technician: buildTechnician({ id: 'T1' }),
      equipment: buildEquipment({ id: 'E1' }),
    });
    const b = buildAssignment({
      sample: buildSample({ id: 'S2' }),
      technician: buildTechnician({ id: 'T2' }),
      equipment: buildEquipment({ id: 'E2' }),
      start: 570,
      end: 630,
    });

    expect(rulesOf([a, b])).toEqual([]);
  });
});

describe('findScheduleViolations : priorités', () => {
  const routine = buildSample({ id: 'R', priority: 'ROUTINE' });
  const stat = buildSample({ id: 'S', priority: 'STAT' });

  it('détecte un ROUTINE qui passe avant un STAT sur la même ressource', () => {
    const early = buildAssignment({ sample: routine, start: 540, end: 570 });
    const late = buildAssignment({ sample: stat, start: 600, end: 630 });

    expect(rulesOf([early, late])).toEqual(['PRIORITY_INVERSION']);
  });

  it('accepte un ROUTINE avant un STAT sur des ressources différentes', () => {
    const early = buildAssignment({ sample: routine, start: 540, end: 570 });
    const late = buildAssignment({
      sample: stat,
      technician: buildTechnician({ id: 'T2' }),
      equipment: buildEquipment({ id: 'E2' }),
      start: 600,
      end: 630,
    });

    expect(rulesOf([early, late])).toEqual([]);
  });

  it('ne compare pas deux échantillons de même priorité', () => {
    const early = buildAssignment({
      sample: buildSample({ id: 'A', priority: 'URGENT' }),
      start: 540,
      end: 570,
    });
    const late = buildAssignment({
      sample: buildSample({ id: 'B', priority: 'URGENT' }),
      start: 600,
      end: 630,
    });

    expect(rulesOf([early, late])).toEqual([]);
  });
});

describe('countConflicts', () => {
  it('additionne les violations et les échantillons non planifiés', () => {
    const invalid = buildAssignment({ equipment: buildEquipment({ type: 'URINE' }) });

    const count = countConflicts({ assignments: [invalid], unscheduled: [buildSample({ id: 'X' })] });

    expect(count).toBe(2);
  });
});
