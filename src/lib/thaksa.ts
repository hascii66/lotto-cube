import { weekdayOf } from './format';

const planetOrder = [1, 2, 3, 4, 7, 5, 8, 6];
const houseOrder = [
  'retinue',
  'age',
  'power',
  'fortune',
  'wealth',
  'effort',
  'support',
  'kalakini',
] as const;
const weekdayPlanet = [1, 2, 3, 4, 5, 6, 7];

export function thaksaForDate(date: string) {
  const weekday = weekdayOf(date);
  const weekdayPlanetNumber = weekdayPlanet[weekday];
  const start = planetOrder.indexOf(weekdayPlanetNumber);
  const positions = houseOrder.map((house, index) => ({
    house,
    digit: planetOrder[(start + index) % planetOrder.length],
  }));
  const favorableHouses = new Set(['power', 'fortune', 'wealth', 'support']);
  const favorable = positions.filter(({ house }) => favorableHouses.has(house));

  return {
    weekday,
    favorable,
    favorableDigits: favorable.map(({ digit }) => digit),
    kalakiniDigit: positions.find(({ house }) => house === 'kalakini')!.digit,
  };
}
