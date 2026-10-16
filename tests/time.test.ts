import { formatTime, parseTime } from '../src/time';

describe('parseTime', () => {
  it.each([
    ['00:00', 0],
    ['09:30', 570],
    ['17:00', 1020],
    ['23:59', 1439],
  ])('convertit %s en %p minutes', (time, expected) => {
    expect(parseTime(time)).toBe(expected);
  });

  it.each(['9:30', '24:00', '12:60', 'abc', ''])('refuse le format invalide "%s"', (time) => {
    expect(() => parseTime(time)).toThrow('expected format HH:MM');
  });
});

describe('formatTime', () => {
  it.each([
    [0, '00:00'],
    [570, '09:30'],
    [1020, '17:00'],
  ])('convertit %p minutes en %s', (minutes, expected) => {
    expect(formatTime(minutes)).toBe(expected);
  });

  it('refuse une durée négative ou décimale', () => {
    expect(() => formatTime(-1)).toThrow(RangeError);
    expect(() => formatTime(1.5)).toThrow(RangeError);
  });

  it('est l\'inverse de parseTime', () => {
    expect(formatTime(parseTime('08:05'))).toBe('08:05');
  });
});