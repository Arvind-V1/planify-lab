import * as fs from 'fs';
import { planifyLab } from './planifyLab';
import { LabData } from './types';

const inputPath = process.argv[2];

if (!inputPath) {
  console.error('Usage: npm start -- <input.json>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8')) as LabData;
console.log(JSON.stringify(planifyLab(data), null, 2));
