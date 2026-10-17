import { computeMetrics } from '../src/metrics';
import { planSamples } from '../src/scheduler';
import { EXAMPLE_1, EXAMPLE_2, EXAMPLE_3 } from './fixtures/examples';
import { buildEquipment, buildSample, buildTechnician } from './helpers/builders';

describe('computeMetrics : exemples du sujet', () => {
  it('exemple 1 : 30 min, 100 %', () => {
    expect(computeMetrics(planSamples(EXAMPLE_1.input))).toEqual({
      totalTime: 30,
      efficiency: 100,
      conflicts: 0,
    });
  });

  it('exemple 2 : 105 min, 71.4 %', () => {
    expect(computeMetrics(planSamples(EXAMPLE_2.input))).toEqual({
      totalTime: 105,
      efficiency: 71.4,
      conflicts: 0,
    });
  });

  it('exemple 3 : 105 min, et 128.6 % avec la formule du sujet', () => {
    // Le JSON du sujet annonce 78.6, ce que la formule Σ durées / temps total ne reproduit pas
    // ((60 + 30 + 45) / 105 = 128.6) : écart documenté dans le README.
    expect(computeMetrics(planSamples(EXAMPLE_3.input))).toEqual({
      totalTime: 105,
      efficiency: 128.6,
      conflicts: 0,
    });
  });
});

describe('computeMetrics : cas particuliers', () => {
  it('retourne des métriques nulles sans échantillon', () => {
    const result = planSamples({
      samples: [],
      technicians: [buildTechnician()],
      equipment: [buildEquipment()],
    });

    expect(computeMetrics(result)).toEqual({ totalTime: 0, efficiency: 0, conflicts: 0 });
  });

  it("mesure le temps total depuis l'arrivée et non depuis le début de l'analyse", () => {
    const result = planSamples({
      samples: [buildSample({ arrivalTime: '09:00', analysisTime: 30 })],
      technicians: [buildTechnician({ startTime: '10:00' })],
      equipment: [buildEquipment()],
    });

    expect(computeMetrics(result)).toEqual({ totalTime: 90, efficiency: 33.3, conflicts: 0 });
  });

  it('compte un échantillon non planifiable comme un conflit', () => {
    const result = planSamples({
      samples: [buildSample({ id: 'S1' }), buildSample({ id: 'S2', type: 'TISSUE' })],
      technicians: [buildTechnician()],
      equipment: [buildEquipment()],
    });

    expect(computeMetrics(result).conflicts).toBe(1);
  });
});
