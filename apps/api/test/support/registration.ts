import { mappingInput } from './mapping.js';
export function writeMappingInput() {
  const input = mappingInput();
  return { ...input, version: 2, years: input.years.map(year => ({ ...year, year: 2020, months: year.months.map(month => ({ ...month,
    categories: month.categories.map(category => ({ ...category, storageCurrency: 'KZT' })),
  })) })) };
}
