import {
  findCompatibleEquipment,
  findCompatibleTechnicians,
  isEquipmentCompatible,
  isTechnicianCompatible,
} from '../src/compatibility';
import { SampleType, TechnicianSpeciality } from '../src/types';
import { buildEquipment, buildSample, buildTechnician } from './helpers/builders';

const TECHNICIAN_CASES: Array<[TechnicianSpeciality, SampleType, boolean]> = [
  ['BLOOD', 'BLOOD', true],
  ['BLOOD', 'URINE', false],
  ['URINE', 'BLOOD', false],
  ['TISSUE', 'TISSUE', true],
  ['TISSUE', 'URINE', false],
  ['GENERAL', 'BLOOD', true],
  ['GENERAL', 'URINE', true],
  ['GENERAL', 'TISSUE', true],
];

describe('isTechnicianCompatible', () => {
  it.each(TECHNICIAN_CASES)('technicien %s et échantillon %s : %p', (speciality, type, expected) => {
    expect(isTechnicianCompatible(buildTechnician({ speciality }), buildSample({ type }))).toBe(expected);
  });
});

describe('isEquipmentCompatible', () => {
  it.each<[SampleType, SampleType, boolean]>([
    ['BLOOD', 'BLOOD', true],
    ['BLOOD', 'URINE', false],
    ['TISSUE', 'TISSUE', true],
  ])('équipement %s et échantillon %s : %p', (equipmentType, sampleType, expected) => {
    expect(
      isEquipmentCompatible(buildEquipment({ type: equipmentType }), buildSample({ type: sampleType })),
    ).toBe(expected);
  });
});

describe('findCompatibleTechnicians', () => {
  const technicians = [
    buildTechnician({ id: 'T1', speciality: 'URINE' }),
    buildTechnician({ id: 'T2', speciality: 'BLOOD' }),
    buildTechnician({ id: 'T3', speciality: 'GENERAL' }),
  ];

  it("retourne les spécialistes du type et les GENERAL, dans l'ordre d'origine", () => {
    const found = findCompatibleTechnicians(buildSample({ type: 'BLOOD' }), technicians);

    expect(found.map((technician) => technician.id)).toEqual(['T2', 'T3']);
  });

  it('retourne une liste vide si aucun technicien ne convient', () => {
    const onlyUrine = [buildTechnician({ speciality: 'URINE' })];

    expect(findCompatibleTechnicians(buildSample({ type: 'TISSUE' }), onlyUrine)).toEqual([]);
  });
});

describe('findCompatibleEquipment', () => {
  it('ne garde que les équipements du bon type', () => {
    const equipment = [
      buildEquipment({ id: 'E1', type: 'URINE' }),
      buildEquipment({ id: 'E2', type: 'BLOOD' }),
    ];

    const found = findCompatibleEquipment(buildSample({ type: 'BLOOD' }), equipment);

    expect(found.map((item) => item.id)).toEqual(['E2']);
  });

  it('exclut les équipements indisponibles au départ', () => {
    const equipment = [
      buildEquipment({ id: 'E1', available: false }),
      buildEquipment({ id: 'E2', available: true }),
    ];

    const found = findCompatibleEquipment(buildSample({ type: 'BLOOD' }), equipment);

    expect(found.map((item) => item.id)).toEqual(['E2']);
  });

  it('retourne une liste vide si tous les équipements du type sont indisponibles', () => {
    const equipment = [buildEquipment({ available: false })];

    expect(findCompatibleEquipment(buildSample({ type: 'BLOOD' }), equipment)).toEqual([]);
  });
});
