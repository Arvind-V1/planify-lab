import { SPECIALITIES } from '../src/constants';
import { planifyLab } from '../src/planifyLab';
import { planSamples } from '../src/scheduler';
import { formatTime, parseTime } from '../src/time';
import { LabData, Priority, SampleType } from '../src/types';
import { findScheduleViolations } from '../src/validation';

const SEED_COUNT = 300;
const SAMPLE_TYPE_LIST: SampleType[] = ['BLOOD', 'URINE', 'TISSUE'];
const PRIORITY_LIST: Priority[] = ['STAT', 'URGENT', 'ROUTINE'];
const MINUTES_PER_HOUR = 60;

type Random = () => number;

/** Générateur pseudo-aléatoire déterministe (mulberry32) : les tests ne sont jamais instables. */
function createRandom(seed: number): Random {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(random: Random, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function pick<T>(random: Random, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

function atHour(hour: number): number {
  return hour * MINUTES_PER_HOUR;
}

function randomLabData(seed: number): LabData {
  const random = createRandom(seed);
  return {
    samples: Array.from({ length: randomInt(random, 0, 15) }, (_, index) => ({
      id: `S${index + 1}`,
      type: pick(random, SAMPLE_TYPE_LIST),
      priority: pick(random, PRIORITY_LIST),
      analysisTime: 5 * randomInt(random, 1, 18),
      arrivalTime: formatTime(randomInt(random, atHour(7), atHour(16))),
      patientId: `P${index + 1}`,
    })),
    technicians: Array.from({ length: randomInt(random, 1, 5) }, (_, index) => ({
      id: `T${index + 1}`,
      speciality: pick(random, SPECIALITIES),
      startTime: formatTime(randomInt(random, atHour(7), atHour(10))),
      endTime: formatTime(randomInt(random, atHour(15), atHour(18))),
    })),
    equipment: Array.from({ length: randomInt(random, 1, 5) }, (_, index) => ({
      id: `E${index + 1}`,
      type: pick(random, SAMPLE_TYPE_LIST),
      available: random() > 0.2,
    })),
  };
}

function findInvariantFailures(seed: number): string[] {
  const data = randomLabData(seed);
  const plan = planifyLab(data);
  const result = planSamples(data);
  const failures: string[] = [];

  if (result.assignments.length + result.unscheduled.length !== data.samples.length) {
    failures.push('un échantillon est perdu ou planifié deux fois');
  }
  for (const violation of findScheduleViolations(result.assignments)) {
    failures.push(`violation ${violation.rule} (${violation.sampleIds.join(', ')})`);
  }
  for (const { sample, start } of result.assignments) {
    if (start < parseTime(sample.arrivalTime)) {
      failures.push(`${sample.id} démarre avant son arrivée`);
    }
  }
  for (let index = 1; index < plan.schedule.length; index++) {
    if (plan.schedule[index].startTime < plan.schedule[index - 1].startTime) {
      failures.push('le planning n\'est pas chronologique');
    }
  }
  if (plan.metrics.conflicts !== result.unscheduled.length) {
    failures.push('conflicts devrait égaler le nombre d\'échantillons non planifiés');
  }
  if (!Number.isFinite(plan.metrics.efficiency) || plan.metrics.efficiency < 0) {
    failures.push(`efficacité invalide : ${plan.metrics.efficiency}`);
  }
  return failures.map((failure) => `graine ${seed} : ${failure}`);
}

describe('invariants sur des jeux de données aléatoires', () => {
  const seeds = Array.from({ length: SEED_COUNT }, (_, index) => index + 1);

  it(`respecte toutes les règles sur ${SEED_COUNT} jeux de données`, () => {
    expect(seeds.flatMap(findInvariantFailures)).toEqual([]);
  });

  it('donne le même planning à chaque exécution', () => {
    for (const seed of seeds) {
      const data = randomLabData(seed);
      expect(planifyLab(data)).toEqual(planifyLab(data));
    }
  });

  it('génère des scénarios variés (échantillons planifiés et non planifiés)', () => {
    const results = seeds.map((seed) => planSamples(randomLabData(seed)));

    expect(results.some(({ assignments }) => assignments.length > 0)).toBe(true);
    expect(results.some(({ unscheduled }) => unscheduled.length > 0)).toBe(true);
    expect(results.some(({ assignments }) => assignments.length >= 8)).toBe(true);
  });
});