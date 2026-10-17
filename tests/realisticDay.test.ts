import { planifyLab } from '../src/planifyLab';
import { planSamples } from '../src/scheduler';
import { Priority, ScheduleEntry } from '../src/types';
import { findScheduleViolations } from '../src/validation';
import { REALISTIC_DAY } from './fixtures/realisticDay';
import { buildEquipment, buildSample, buildTechnician } from './helpers/builders';

function entry(
  sampleId: string,
  priority: Priority,
  technicianId: string,
  equipmentId: string,
  startTime: string,
  endTime: string,
): ScheduleEntry {
  return { sampleId, technicianId, equipmentId, startTime, endTime, priority };
}

describe('journée réaliste : 10 échantillons, 4 techniciens, 3 équipements', () => {
  const plan = planifyLab(REALISTIC_DAY);

  function entryOf(sampleId: string): ScheduleEntry {
    const found = plan.schedule.find((scheduled) => scheduled.sampleId === sampleId);
    if (!found) {
      throw new Error(`Sample ${sampleId} is not scheduled`);
    }
    return found;
  }

  it('produit le planning attendu, trié par heure de début', () => {
    expect(plan.schedule).toEqual([
      entry('S004', 'URGENT', 'T004', 'E003', '09:15', '10:15'),
      entry('S005', 'STAT', 'T001', 'E001', '09:30', '09:55'),
      entry('S002', 'URGENT', 'T001', 'E001', '09:55', '10:25'),
      entry('S006', 'STAT', 'T002', 'E002', '10:00', '10:15'),
      entry('S001', 'ROUTINE', 'T001', 'E001', '10:25', '11:10'),
      entry('S008', 'ROUTINE', 'T003', 'E003', '11:00', '11:50'),
      entry('S007', 'ROUTINE', 'T001', 'E001', '11:10', '11:50'),
      entry('S009', 'URGENT', 'T002', 'E002', '11:30', '12:00'),
      entry('S003', 'ROUTINE', 'T002', 'E002', '12:00', '12:20'),
      entry('S010', 'ROUTINE', 'T001', 'E001', '14:00', '14:35'),
    ]);
  });

  it('calcule les métriques : 365 min, 95.9 %, aucun conflit', () => {
    expect(plan.metrics).toEqual({ totalTime: 365, efficiency: 95.9, conflicts: 0 });
  });

  it('démarre chaque STAT dès son arrivée', () => {
    expect(entryOf('S005').startTime).toBe('09:30');
    expect(entryOf('S006').startTime).toBe('10:00');
  });

  it('confie un TISSUE au technicien GENERAL tant que le spécialiste n\'a pas pris son service', () => {
    expect(entryOf('S004').technicianId).toBe('T004');
    expect(entryOf('S004').startTime).toBe('09:15');
  });

  it('préfère le spécialiste au GENERAL quand les deux peuvent démarrer en même temps', () => {
    expect(entryOf('S008').technicianId).toBe('T003');
  });

  it('fait passer un URGENT tardif avant un ROUTINE arrivé plus tôt sur le même équipement', () => {
    // S003 (ROUTINE) arrive à 08:45 mais S009 (URGENT, 11:30) occupe l'analyseur d'urine avant lui.
    expect(entryOf('S009').endTime).toBe('12:00');
    expect(entryOf('S003').startTime).toBe('12:00');
  });

  it('ne laisse aucune violation de règle dans le planning', () => {
    expect(findScheduleViolations(planSamples(REALISTIC_DAY).assignments)).toEqual([]);
  });
});

describe('limites connues du modèle « libre après la dernière réservation »', () => {
  it('un STAT en fin de journée peut rendre un échantillon moins prioritaire impossible à planifier', () => {
    // S1 (STAT, 16:40) réserve l'équipement jusqu'à 17:00 ; S2 (ROUTINE, 08:00) ne peut alors plus
    // finir avant la fin de service de 17:00, alors que l'équipement était libre toute la journée.
    const plan = planifyLab({
      samples: [
        buildSample({ id: 'S1', priority: 'STAT', arrivalTime: '16:40', analysisTime: 20 }),
        buildSample({ id: 'S2', priority: 'ROUTINE', arrivalTime: '08:00', analysisTime: 30 }),
      ],
      technicians: [buildTechnician({ endTime: '17:00' })],
      equipment: [buildEquipment()],
    });

    expect(plan.schedule.map((scheduled) => scheduled.sampleId)).toEqual(['S1']);
    expect(plan.metrics.conflicts).toBe(1);
  });
});