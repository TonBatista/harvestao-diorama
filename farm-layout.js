// Four times the original farm area: width and depth are both doubled.
export const MAIN_FARM_BOUNDS=Object.freeze([-22,26,-26,26]);
export const LOT_FARM_BOUNDS=Object.freeze([-10,14,-13,13]);
export function farmBounds(property='farm'){return property==='farm'?MAIN_FARM_BOUNDS:LOT_FARM_BOUNDS}
