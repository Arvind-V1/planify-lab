import { assertValidLabData, findInputProblems, InvalidLabDataError } from '../src/inputValidation';
import { LabData } from '../src/types';
import { EXAMPLE_1, EXAMPLE_2, EXAMPLE_3 } from './fixtures/examples';
import { buildEquipment, buildSample, buildTechnician } from './helpers/builders';

function validData(overrides: Partial<LabData> = {}): LabData {
  return {
    samples: [buildSample()],
    technicians: [buildTechnician()],
    equipment: [buildEquipment()],
    ...overrides,
  };
}

describe('findInputProblems : données valides', () => {
  it.each([
    ['exemple 1', EXAMPLE_1],
    ['exemple 2', EXAMPLE_2],
    ['exemple 3', EXAMPLE_3],
  ])("accepte l'%s du sujet", (_name, example) => {
    expect(findInputProblems(example.input)).toEqual([]);
  });

  it('accepte des listes vides', () => {
    expect(findInputProblems({ samples: [], technicians: [], equipment: [] })).toEqual([]);
  });
});

describe('findInputProblems : structure', () => {
  it("refuse une collection qui n'est pas un tableau", () => {
    expect(findInputProblems(validData({ samples: undefined as never }))).toEqual([
      'samples must be an array',
    ]);
  });

  it("signale les trois collections quand l'entrée est absente", () => {
    expect(findInputProblems(undefined as never)).toEqual([
      'samples must be an array',
      'technicians must be an array',
      'equipment must be an array',
    ]);
  });
});

describe('findInputProblems : échantillons', () => {
  it('refuse un type inconnu', () => {
    const data = validData({ samples: [buildSample({ id: 'S1', type: 'PLASMA' as never })] });

    expect(findInputProblems(data)).toEqual(['sample "S1": unknown type "PLASMA"']);
  });

  it('refuse une priorité inconnue', () => {
    const data = validData({ samples: [buildSample({ id: 'S1', priority: 'LOW' as never })] });

    expect(findInputProblems(data)).toEqual(['sample "S1": unknown priority "LOW"']);
  });

  it.each([0, -5, 1.5, NaN, '30' as never])('refuse la durée %p', (analysisTime) => {
    const data = validData({ samples: [buildSample({ id: 'S1', analysisTime })] });

    expect(findInputProblems(data)).toHaveLength(1);
    expect(findInputProblems(data)[0]).toContain('sample "S1": analysisTime must be a positive integer');
  });

  it("refuse une heure d'arrivée invalide", () => {
    const data = validData({ samples: [buildSample({ id: 'S1', arrivalTime: '9h00' })] });

    expect(findInputProblems(data)).toEqual(['sample "S1": invalid arrivalTime "9h00" (expected HH:MM)']);
  });
});

describe('findInputProblems : techniciens', () => {
  it('refuse une spécialité inconnue', () => {
    const data = validData({ technicians: [buildTechnician({ id: 'T1', speciality: 'DNA' as never })] });

    expect(findInputProblems(data)).toEqual(['technician "T1": unknown speciality "DNA"']);
  });

  it('refuse des horaires invalides', () => {
    const data = validData({
      technicians: [buildTechnician({ id: 'T1', startTime: '8h', endTime: '25:00' })],
    });

    expect(findInputProblems(data)).toEqual([
      'technician "T1": invalid startTime "8h" (expected HH:MM)',
      'technician "T1": invalid endTime "25:00" (expected HH:MM)',
    ]);
  });

  it("refuse une fin de service qui n'est pas après le début", () => {
    const data = validData({
      technicians: [buildTechnician({ id: 'T1', startTime: '17:00', endTime: '08:00' })],
    });

    expect(findInputProblems(data)).toEqual(['technician "T1": endTime must be after startTime']);
  });
});

describe('findInputProblems : équipements', () => {
  it('refuse un type inconnu', () => {
    const data = validData({ equipment: [buildEquipment({ id: 'E1', type: 'GENERAL' as never })] });

    expect(findInputProblems(data)).toEqual(['equipment "E1": unknown type "GENERAL"']);
  });

  it("refuse un indicateur de disponibilité qui n'est pas un booléen", () => {
    const data = validData({ equipment: [buildEquipment({ id: 'E1', available: 'yes' as never })] });

    expect(findInputProblems(data)).toEqual(['equipment "E1": available must be a boolean']);
  });
});

describe('findInputProblems : identifiants', () => {
  it('signale un identifiant dupliqué', () => {
    const data = validData({ samples: [buildSample({ id: 'S1' }), buildSample({ id: 'S1' })] });

    expect(findInputProblems(data)).toEqual(['sample "S1": duplicate id']);
  });

  it('accepte le même identifiant dans deux collections différentes', () => {
    const data = validData({
      technicians: [buildTechnician({ id: 'X' })],
      equipment: [buildEquipment({ id: 'X' })],
    });

    expect(findInputProblems(data)).toEqual([]);
  });
});

describe('assertValidLabData', () => {
  it('ne lève rien pour des données valides', () => {
    expect(() => assertValidLabData(validData())).not.toThrow();
  });

  it('lève une InvalidLabDataError qui liste tous les problèmes', () => {
    const data = validData({
      samples: [buildSample({ id: 'S1', analysisTime: 0 })],
      technicians: [buildTechnician({ id: 'T1', speciality: 'DNA' as never })],
    });

    expect(() => assertValidLabData(data)).toThrow(InvalidLabDataError);
    expect(() => assertValidLabData(data)).toThrow(/sample "S1".*\n- technician "T1"/s);
  });
});
