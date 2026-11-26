import { expect, test } from 'vitest';
import { normalizeAmount, buildExpenseTerm, appendExpense } from '../../src/application/expense-formula.js';
import type { CurrencyBinding, SheetCell } from '../../src/application/ports/workbook.js';
const sheet = 'Synthetic January';
const base: CurrencyBinding = { code: 'KZT', rate: null };
const aed: CurrencyBinding = { code: 'AED', rate: { sheetTitle: sheet, row: 39, column: 6, operation: 'multiply' } };
const gbp: CurrencyBinding = { code: 'GBP', rate: { sheetTitle: "Rates 'tab", row: 7, column: 27, operation: 'divide' } };
const cell = (formula: string): SheetCell => ({ row: 16, column: 3, formula, value: 500 });
test.each([['5','5'],['0005.120000','5.12'],['0.000001','0.000001'],['999999999.999999','999999999.999999']])('decimal %s canonicalizes without rounding', (input, expected) => {
  expect(normalizeAmount(input)).toBe(expected);
});
test.each([undefined,null,5,'','0','0.000000','-5','+5','1e3','NaN','Infinity','1,000','1 000',' 5','5 ','1.0000001','1000000000','5+6','=5','5.','.' ])('untrusted amount %s cannot become formula syntax', input => {
  expect(() => normalizeAmount(input)).toThrow('invalid_amount');
});
test('each conversion uses explicit direction and absolute references, including native storage', () => {
  expect(buildExpenseTerm('100', base, base, sheet)).toBe('100');
  expect(buildExpenseTerm('100', aed, base, sheet)).toBe('100*$F$39');
  expect(buildExpenseTerm('100', gbp, base, sheet)).toBe("100/'Rates ''tab'!$AA$7");
  expect(buildExpenseTerm('100', aed, aed, sheet)).toBe('100');
  expect(buildExpenseTerm('100', base, aed, sheet)).toBe('100/$F$39');
  expect(buildExpenseTerm('100', base, gbp, sheet)).toBe("100*'Rates ''tab'!$AA$7");
  expect(buildExpenseTerm('100', aed, gbp, sheet)).toBe("(100*$F$39)*'Rates ''tab'!$AA$7");
});
test('broken reference/mapping cannot generate an expense term', () => {
  expect(() => buildExpenseTerm('5', { code: 'AED', rate: null }, base, sheet)).toThrow('mapping_invalid');
  expect(() => buildExpenseTerm('5', { ...aed, rate: { ...aed.rate!, row: 0 } }, base, sheet)).toThrow('mapping_invalid');
});
test('new additions preserve complete old expression text and precedence', () => {
  expect(appendExpense(undefined,'5',sheet)).toEqual({ formula: '=(5)', duplicate:'none' });
  expect(appendExpense({row:16,column:3,value:0},'5',sheet)).toEqual({ formula:'=(0)+(5)',duplicate:'none' });
  for(const [old,expected] of [['=(5)+(6)','=(5)+(6)+(7)'],['=(100+5)*F39','=((100+5)*F39)+(7)'],['=100/(5+6)-2','=(100/(5+6)-2)+(7)'],['= -5 + (6*2)','=( -5 + (6*2))+(7)'],['=1e3+0.5','=(1e3+0.5)+(7)'],["='Rates ''tab'!AA7+F39","=('Rates ''tab'!AA7+F39)+(7)"]]){
    expect(appendExpense(cell(old!),'7',sheet).formula).toBe(expected);
  }
});
test('duplicate signals match complete normalized terms and currency references, not every numeric literal', () => {
  expect(appendExpense(cell('=(5)+(6)'),'6',sheet).duplicate).toBe('possible');
  expect(appendExpense(cell('=(100*F39)+(500)'),'100*$F$39',sheet).duplicate).toBe('possible');
  expect(appendExpense(cell('=(100*$F$39)+(500)'),'100',sheet).duplicate).toBe('none');
  expect(appendExpense(cell('=(100+5)*F39'),'100*$F$39',sheet).duplicate).toBe('inconclusive');
  expect(appendExpense(cell('=C5-5'),'5',sheet).duplicate).toBe('inconclusive');
  expect(appendExpense(cell('=6+7'),'8',sheet).duplicate).toBe('none');
});
test.each(['=(100+5','=5+)6(','=5++','=5 6','=SUM(A1:A3)','=IMPORTRANGE("x","A1")','=A0','=ZZZZ1','=A10000001',"='[other]Sheet'!A1",'=A1:B2','=named','=5^2','=1/','=1e999','=TRUE','=5&6'])('unsupported expression %s fails before a candidate is made', formula => {
  expect(() => appendExpense(cell(formula),'5',sheet)).toThrow('unsupported_formula');
});
test.each([{row:1,column:1,value:'=(100+5'},{row:1,column:1,value:true},{row:1,column:1,value:null,error:'REF'}] satisfies SheetCell[])('non-numeric/erroneous cell is never repaired', value => {
  expect(() => appendExpense(value,'5',sheet)).toThrow('unsupported_formula');
});
test('expression length, token count and recursive grouping are bounded', () => {
  for(const formula of ['='+ '1+'.repeat(4100)+'1','='+ '1+'.repeat(1100)+'1','='+ '('.repeat(33)+'1'+')'.repeat(33)]){
    expect(() => appendExpense(cell(formula),'5',sheet)).toThrow('unsupported_formula');
  }
});


test.each([
 ['=12+13+14*F4','5','=(12+13+14*F4)+(5)'],
 ['=(12+13)*F4','5*$F$39','=((12+13)*F4)+(5*$F$39)'],
 ['=12-13+14*F4','5','=(12-13+14*F4)+(5)'],
 ['=12/2+13','5','=(12/2+13)+(5)'],
 ['=12','5','=(12)+(5)'],
 ['=(12)+(13)+14','5','=((12)+(13)+14)+(5)'],
 ["=('Rates )''( tab'!$A$1)+(2)",'5',"=('Rates )''( tab'!$A$1)+(2)+(5)"],
 ["=('Rates )''( tab'!$A$1)*2",'5',"=(('Rates )''( tab'!$A$1)*2)+(5)"],
 ['= (12) + (13*F4) ','5','= (12) + (13*F4) +(5)'],
 ['=((12)+(13))+(14)','5','=((12)+(13))+(14)+(5)'],
])('manual formula %s preserves its entire old meaning with new term %s', (old,term,expected)=>{
 expect(appendExpense(cell(old!),term!,sheet).formula).toBe(expected);
});

test('many additions keep a manually entered base block flat instead of growing nesting depth',()=>{
 const original='12+13+14*F4';let formula='='+original;const added:string[]=[];
 for(let n=1;n<=80;n++){added.push(`(${n})`);formula=appendExpense(cell(formula),String(n),sheet).formula;expect(formula).toBe(`=(${original})+${added.join('+')}`);}
});

test('numeric scalar content is grouped once and retained before new FX',()=>{
 expect(appendExpense({row:16,column:3,value:-12},'5*$F$39',sheet).formula).toBe('=(-12)+(5*$F$39)');
});
