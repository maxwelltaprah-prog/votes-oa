export const BUSINESSES = ["Corporate", "Grains", "Pasta", "Rice"] as const;
export type Business = (typeof BUSINESSES)[number];

export const DEPARTMENTS = [
  "Marketing",
  "Administration",
  "Communications",
  "Health Safety and Environment (HSE)",
  "Engineering",
  "Procurement",
  "Finance",
  "Legal",
  "HR/Admin",
  "IT",
  "Logistics / Warehouse",
  "MATS",
  "Shipping",
  "Port Operations",
  "Sales",
  "Supply Chain",
  "Sustainability",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const TOP_N_OPTIONS = [3, 5, 10] as const;

export const JUSTIFICATION_MIN = 10;
export const JUSTIFICATION_MAX = 2000;
