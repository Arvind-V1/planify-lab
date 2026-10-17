import { InvalidLabDataError } from '../src/inputValidation';
import { planifyLab } from '../src/planifyLab';
import { EXAMPLE_1, EXAMPLE_2, EXAMPLE_3 } from './fixtures/examples';
import { buildEquipment, buildSample, buildTechnician } from './helpers/builders';

describe('planifyLab : exemples du sujet de bout en bout', () => {
  it.each([
    ['exemple 1', EXAMPLE_1, { totalTime: 30, efficiency: 100, conflicts: 0 }],
    ['exemple 2', EXAMPLE_2, { totalTime: 105, efficiency: 71.4, conflicts: 0 }],
    // Le sujet annonce 78.6 : la formule du sujet donne (60 + 30 + 45) / 105 = 128.6 (voir README).
    ['exemple 3', EXAMPLE_3, { totalTime: 105, efficiency: 128.6, conflicts: 0 }],
  ])('%s : planning et métriques', (_name, example, expectedMetrics) => {
    expect(planifyLab(example.input)).toEqual({ schedule: example.schedule, metrics: expectedMetrics });
  });
});

describe('planifyLab : ordre du planning', () => {
  it('trie le planning par heure de début, même si le traitement suit la priorité', () => {
    const plan = planifyLab({
      samples: [
        buildSample({ id: 'S', type: 'BLOOD', priority: 'STAT', arrivalTime: '10:00' }),
        buildSample({ id: 'R', type: 'URINE', priority: 'ROUTINE', arrivalTime: '08:00' }),
      ],
      technicians: [
        buildTechnician({ id: 'T1', speciality: 'BLOOD' }),
        buildTechnician({ id: 'T2', speciality: 'URINE' }),
      ],
      equipment: [buildEquipment({ id: 'E1', type: 'BLOOD' }), buildEquipment({ id: 'E2', type: 'URINE' })],
    });

    expect(plan.schedule.map((entry) => entry.sampleId)).toEqual(['R', 'S']);
    expect(plan.metrics.conflicts).toBe(0);
  });

  it('départage à heure de début égale par priorité puis par identifiant', () => {
    const plan = planifyLab({
      samples: [
        buildSample({ id: 'S3', priority: 'ROUTINE', arrivalTime: '09:00', analysisTime: 30 }),
        buildSample({ id: 'S2', priority: 'STAT', arrivalTime: '09:00', analysisTime: 30 }),
        buildSample({ id: 'S1', priority: 'STAT', arrivalTime: '09:00', analysisTime: 30 }),
      ],
      technicians: [
        buildTechnician({ id: 'T1' }),
        buildTechnician({ id: 'T2' }),
        buildTechnician({ id: 'T3' }),
      ],
      equipment: [buildEquipment({ id: 'E1' }), buildEquipment({ id: 'E2' }), buildEquipment({ id: 'E3' })],
    });

    expect(plan.schedule.map((entry) => entry.sampleId)).toEqual(['S1', 'S2', 'S3']);
  });
});

describe('planifyLab : robustesse', () => {
  it('retourne un planning vide et des métriques nulles sans échantillon', () => {
    const plan = planifyLab({ samples: [], technicians: [buildTechnician()], equipment: [buildEquipment()] });

    expect(plan).toEqual({ schedule: [], metrics: { totalTime: 0, efficiency: 0, conflicts: 0 } });
  });

  it('refuse des données invalides avec une erreur explicite', () => {
    const data = { ...EXAMPLE_1.input, samples: [buildSample({ id: 'S1', arrivalTime: 'matin' })] };

    expect(() => planifyLab(data)).toThrow(InvalidLabDataError);
    expect(() => planifyLab(data)).toThrow('invalid arrivalTime "matin"');
  });

  it('ne modifie pas les données reçues', () => {
    const before = JSON.stringify(EXAMPLE_3.input);

    planifyLab(EXAMPLE_3.input);

    expect(JSON.stringify(EXAMPLE_3.input)).toBe(before);
  });

  it('donne le même résultat à chaque appel', () => {
    expect(planifyLab(EXAMPLE_3.input)).toEqual(planifyLab(EXAMPLE_3.input));
  });

  it('signale en conflit un échantillon qu\'aucune ressource ne peut traiter', () => {
    const plan = planifyLab({
      samples: [buildSample({ id: 'S1', type: 'TISSUE' })],
      technicians: [buildTechnician()],
      equipment: [buildEquipment()],
    });

    expect(plan.schedule).toEqual([]);
    expect(plan.metrics.conflicts).toBe(1);
  });
});