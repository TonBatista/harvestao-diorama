// Shared, texture-free outdoor colors. Season numbers match simulation.js.
const freezeLook = look => Object.freeze({
  ...look,
  foliage: Object.freeze(look.foliage),
  pine: Object.freeze(look.pine),
  ground: Object.freeze(look.ground),
});

export const SEASON_LOOKS = Object.freeze([
  freezeLook({
    name: 'spring', snow: 0,
    foliage: ['#84b958', '#afd57b', '#68a44e'],
    pine: ['#608651', '#86aa66', '#4e7649'],
    ground: ['#91ad65', '#abc57d', '#809c59'],
    snowColor: '#edf4f3',
  }),
  freezeLook({
    name: 'summer', snow: 0,
    foliage: ['#4f8c3d', '#79aa50', '#36753b'],
    pine: ['#4e7743', '#719454', '#416c40'],
    ground: ['#7b9954', '#98b168', '#6a8a49'],
    snowColor: '#edf4f3',
  }),
  freezeLook({
    name: 'autumn', snow: 0,
    foliage: ['#d8752d', '#edb844', '#b74c30'],
    pine: ['#657c43', '#829550', '#526e3e'],
    ground: ['#ba985b', '#c9ad70', '#a38d52'],
    snowColor: '#edf4f3',
  }),
  freezeLook({
    name: 'winter', snow: 1,
    foliage: ['#81948a', '#a7b6ab', '#71867e'],
    pine: ['#617d70', '#8ba293', '#567369'],
    ground: ['#c3d1c7', '#d4dfd6', '#a9bdb0'],
    snowColor: '#edf4f3',
  }),
]);

const SEASON_NAMES = Object.freeze({spring:0, primavera:0, summer:1, verao:1, autumn:2, fall:2, outono:2, winter:3, inverno:3});

export function normalizeSeason(value = 0) {
  if (typeof value === 'string') {
    const key = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (Object.hasOwn(SEASON_NAMES, key)) return SEASON_NAMES[key];
  }
  const number = Number(value);
  return Number.isFinite(number) ? ((Math.floor(number) % 4) + 4) % 4 : 0;
}

export function getSeasonLook(season) {
  return SEASON_LOOKS[normalizeSeason(season)];
}