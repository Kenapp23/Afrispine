// Culturally-named savings circles — call it what people call it at home
export interface SavingsCircleName {
  name: string;
  plural: string;
  alt?: string;
  tagline: string;
  types?: { value: string; label: string }[];
}

const SAVINGS_CIRCLE_NAMES: Record<string, SavingsCircleName> = {
  KE: {
    name: 'Chama',
    plural: 'Chamas',
    tagline: 'Save together, win together',
    types: [
      { value: 'investment', label: 'Investment Chama' },
      { value: 'welfare', label: 'Welfare / Burial Chama' },
      { value: 'christmas', label: 'Christmas Chama (Harambee)' },
    ],
  },
  NG: {
    name: 'Esusu',
    plural: 'Esusus',
    alt: 'Ajo',
    tagline: 'Saving like home',
    types: [
      { value: 'general', label: 'Esusu (General)' },
      { value: 'investment', label: 'Investment Ajo' },
      { value: 'welfare', label: 'Welfare Esusu' },
    ],
  },
  GH: {
    name: 'Susu',
    plural: 'Susu groups',
    tagline: 'Together we save more',
    types: [
      { value: 'general', label: 'Susu Group' },
      { value: 'investment', label: 'Investment Susu' },
    ],
  },
  ZA: {
    name: 'Stokvel',
    plural: 'Stokvels',
    tagline: 'Ubuntu in savings',
    types: [
      { value: 'general', label: 'General Stokvel' },
      { value: 'christmas', label: 'Christmas Stokvel' },
      { value: 'grocery', label: 'Grocery Stokvel' },
      { value: 'investment', label: 'Investment Stokvel' },
      { value: 'burial_society', label: 'Burial Society' },
    ],
  },
  SN: {
    name: 'Tontine',
    plural: 'Tontines',
    tagline: 'Épargner ensemble',
    types: [
      { value: 'general', label: 'Tontine (Générale)' },
    ],
  },
  CI: {
    name: 'Tontine',
    plural: 'Tontines',
    tagline: 'Épargner ensemble',
    types: [
      { value: 'general', label: 'Tontine (Générale)' },
    ],
  },
  CM: {
    name: 'Tontine',
    plural: 'Tontines',
    tagline: 'Épargner ensemble',
    types: [
      { value: 'general', label: 'Tontine (Générale)' },
    ],
  },
  ET: {
    name: 'Equb',
    plural: 'Equbs',
    tagline: 'Ethiopian savings tradition',
    types: [
      { value: 'general', label: 'Equb (General)' },
    ],
  },
  ER: {
    name: 'Equb',
    plural: 'Equbs',
    tagline: 'Eritrean savings tradition',
    types: [
      { value: 'general', label: 'Equb (General)' },
    ],
  },
  TZ: {
    name: 'Chama',
    plural: 'Chamas',
    tagline: 'Save together, win together',
    types: [
      { value: 'investment', label: 'Investment Chama' },
      { value: 'welfare', label: 'Welfare Chama' },
    ],
  },
  UG: {
    name: 'Chama',
    plural: 'Chamas',
    tagline: 'Save together, grow together',
    types: [
      { value: 'investment', label: 'Investment Chama' },
      { value: 'welfare', label: 'Welfare Chama' },
    ],
  },
};

const DEFAULT: SavingsCircleName = {
  name: 'Savings Circle',
  plural: 'Savings Circles',
  tagline: 'Save together',
  types: [
    { value: 'general', label: 'General Savings' },
    { value: 'investment', label: 'Investment Circle' },
  ],
};

export function getSavingsCircleName(countryCode?: string): SavingsCircleName {
  if (!countryCode) return DEFAULT;
  const code = countryCode.toUpperCase();
  return SAVINGS_CIRCLE_NAMES[code] || DEFAULT;
}

export function getSavingsCircleNames(): Record<string, SavingsCircleName> {
  return SAVINGS_CIRCLE_NAMES;
}

export const ALL_CIRCLE_COUNTRIES = Object.entries(SAVINGS_CIRCLE_NAMES).map(([code, info]) => ({
  code,
  ...info,
}));