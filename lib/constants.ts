export const BUSINESSES = ["Corporate", "Grains", "Pasta", "Rice"] as const;
export type Business = (typeof BUSINESSES)[number];

export const FUNCTIONS = ["Finance", "HR/Admin", "IT", "MATS"] as const;
export type BusinessFunction = (typeof FUNCTIONS)[number];

export const TOP_N_OPTIONS = [3, 5, 10] as const;

export const JUSTIFICATION_MIN = 10;
export const JUSTIFICATION_MAX = 2000;
