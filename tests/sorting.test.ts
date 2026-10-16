import { sortSamplesByPriority } from '../src/sorting';
import { Sample } from '../src/types';
import { buildSample } from './helpers/builders';

function idsOf(samples: Sample[]): string[] {
  return samples.map((sample) => sample.id);
}

describe('sortSamplesByPriority', () => {
  it('place les STAT avant les URGENT avant les ROUTINE', () => {
    const sorted = sortSamplesByPriority([
      buildSample({ id: 'R', priority: 'ROUTINE' }),
      buildSample({ id: 'U', priority: 'URGENT' }),
      buildSample({ id: 'S', priority: 'STAT' }),
    ]);

    expect(idsOf(sorted)).toEqual(['S', 'U', 'R']);
  });

  it('place un STAT arrivé tard avant un ROUTINE arrivé tôt', () => {
    const sorted = sortSamplesByPriority([
      buildSample({ id: 'R', priority: 'ROUTINE', arrivalTime: '08:00' }),
      buildSample({ id: 'S', priority: 'STAT', arrivalTime: '16:55' }),
    ]);

    expect(idsOf(sorted)).toEqual(['S', 'R']);
  });

  it('trie par heure d\'arrivée à priorité égale', () => {
    const sorted = sortSamplesByPriority([
      buildSample({ id: 'A', arrivalTime: '10:00' }),
      buildSample({ id: 'B', arrivalTime: '09:05' }),
      buildSample({ id: 'C', arrivalTime: '09:30' }),
    ]);

    expect(idsOf(sorted)).toEqual(['B', 'C', 'A']);
  });

  it('départage par identifiant à priorité et arrivée égales', () => {
    const sorted = sortSamplesByPriority([buildSample({ id: 'S002' }), buildSample({ id: 'S001' })]);

    expect(idsOf(sorted)).toEqual(['S001', 'S002']);
  });

  it('ne modifie pas le tableau d\'origine', () => {
    const original = [buildSample({ id: 'R' }), buildSample({ id: 'S', priority: 'STAT' })];

    sortSamplesByPriority(original);

    expect(idsOf(original)).toEqual(['R', 'S']);
  });

  it('retourne un tableau vide pour une entrée vide', () => {
    expect(sortSamplesByPriority([])).toEqual([]);
  });

  it('reproduit l\'ordre de l\'exemple 2 du sujet', () => {
    const sorted = sortSamplesByPriority([
      buildSample({ id: 'S001', priority: 'URGENT', arrivalTime: '09:00' }),
      buildSample({ id: 'S002', priority: 'STAT', arrivalTime: '09:30' }),
    ]);

    expect(idsOf(sorted)).toEqual(['S002', 'S001']);
  });

  it('reproduit l\'ordre de l\'exemple 3 du sujet', () => {
    const sorted = sortSamplesByPriority([
      buildSample({ id: 'S003', priority: 'ROUTINE', arrivalTime: '09:00' }),
      buildSample({ id: 'S002', priority: 'URGENT', arrivalTime: '09:15' }),
      buildSample({ id: 'S001', priority: 'URGENT', arrivalTime: '09:00' }),
    ]);

    expect(idsOf(sorted)).toEqual(['S001', 'S002', 'S003']);
  });
});