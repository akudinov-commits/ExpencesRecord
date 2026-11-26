import { expect, test } from 'vitest';
import { parseMappingConfiguration } from '../../src/bootstrap/mapping-config.js';
import { mappingEnvironment, mappingInput } from '../support/mapping.js';
import { writeMappingInput } from '../support/registration.js';
test.each(['KZT', 'AED'])('version 2 preserves explicit category storage currency %s', currency => {
  const input = writeMappingInput(); input.years[0]!.months[0]!.categories[0]!.storageCurrency = currency;
  const result = parseMappingConfiguration(mappingEnvironment(input));
  expect(result.years[0]!.months[0]!.categories[0]).toEqual({ id: 'groceries', label: 'Synthetic groceries', column: 3, storageCurrency: currency });
});
test('version 1 reads retain their old shape without implicit write storage currency', () => {
  expect(parseMappingConfiguration(mappingEnvironment()).years[0]!.months[0]!.categories[0]).not.toHaveProperty('storageCurrency');
});
test.each(['absent', 'empty', 'lowercase', 'unconfigured', 'unknown-key'])('version 2 rejects %s storage declarations safely', failure => {
  const input = writeMappingInput(); const category = input.years[0]!.months[0]!.categories[0]!;
  if (failure === 'absent') Reflect.deleteProperty(category, 'storageCurrency');
  if (failure === 'empty') category.storageCurrency = '';
  if (failure === 'lowercase') category.storageCurrency = 'aed';
  if (failure === 'unconfigured') category.storageCurrency = 'USD';
  if (failure === 'unknown-key') Object.assign(category, { privateExtra: 'private-marker' });
  expect(() => parseMappingConfiguration(mappingEnvironment(input))).toThrow('Invalid mapping configuration');
});
test('version 1 cannot smuggle write storage declarations through its closed schema', () => {
  const input = mappingInput(); Object.assign(input.years[0]!.months[0]!.categories[0]!, { storageCurrency: 'KZT' });
  expect(() => parseMappingConfiguration(mappingEnvironment(input))).toThrow('Invalid mapping configuration');
});
