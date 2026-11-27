import type { CurrencyBinding, RateReference, SheetCell } from './ports/workbook.js';
import { ExpenseError } from './ports/expenses.js';
const unsupported = (): never => { throw new ExpenseError('unsupported_formula'); };
const invalidMapping = (): never => { throw new ExpenseError('mapping_invalid'); };
export function appendExpenses(cell: SheetCell | undefined, terms: string[], sheet: string) {
  if (!terms.length || terms.length > 20) return unsupported();
  let current = cell;
  let formula = '';
  let duplicate: 'none' | 'possible' | 'inconclusive' = 'none';
  for (const term of terms) {
    const observed = appendExpense(cell, term, sheet).duplicate;
    if (observed === 'possible' || (observed === 'inconclusive' && duplicate === 'none')) duplicate = observed;
    formula = appendExpense(current, term, sheet).formula;
    current = { row: cell?.row ?? 1, column: cell?.column ?? 1, value: null, formula };
  }
  return { formula, duplicate };
}
export function normalizeAmount(value: unknown): string {
  if (typeof value !== 'string' || value.length > 32 || !/^\d+(?:\.\d{1,6})?$/.test(value)) throw new ExpenseError('invalid_amount');
  const [rawInteger, rawFraction = ''] = value.split('.'); const integer = rawInteger!.replace(/^0+(?=\d)/, ''); const fraction = rawFraction.replace(/0+$/, '');
  if (integer.length > 9 || (integer === '0' && !fraction)) throw new ExpenseError('invalid_amount');
  return integer + (fraction ? '.' + fraction : '');
}
function letters(column: number): string {
  let result = ''; for (let n = column; n > 0; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + (n - 1) % 26) + result; return result;
}
function rateAddress(rate: RateReference, sheet: string): string {
  if (!Number.isSafeInteger(rate.row) || rate.row < 1 || rate.row > 10000000 || !Number.isSafeInteger(rate.column) || rate.column < 1 || rate.column > 18278
    || !rate.sheetTitle || rate.sheetTitle.length > 100 || (rate.sheetTitle.includes('[') || rate.sheetTitle.includes(']')) || [...rate.sheetTitle].some(c => c.charCodeAt(0) < 32)
    || !['multiply', 'divide'].includes(rate.operation)) return invalidMapping();
  return (rate.sheetTitle === sheet ? '' : `'${rate.sheetTitle.replaceAll("'", "''")}'!`) + `$${letters(rate.column)}$${rate.row}`;
}
export function buildExpenseTerm(amount: string, input: CurrencyBinding, storage: CurrencyBinding, sheet: string): string {
  amount = normalizeAmount(amount);
  if (!/^[A-Z]{3}$/.test(input.code) || !/^[A-Z]{3}$/.test(storage.code)) return invalidMapping();
  const from = input.rate ? rateAddress(input.rate, sheet) : null; const to = storage.rate ? rateAddress(storage.rate, sheet) : null;
  if (input.code === storage.code) return amount;
  if (!from && !to) return invalidMapping();
  let result = from ? amount + (input.rate!.operation === 'multiply' ? '*' : '/') + from : amount;
  if (to) result = (from ? `(${result})` : result) + (storage.rate!.operation === 'multiply' ? '/' : '*') + to;
  return result;
}
type Expr = { kind: 'number'; value: string } | { kind: 'reference'; value: string } | { kind: 'unary'; op: string; child: Expr } | { kind: 'binary'; op: string; left: Expr; right: Expr };
type Token = { kind: 'number' | 'reference' | 'symbol' | 'end'; value: string };
class Parser {
  private position = 0; private count = 0; private token: Token = { kind: 'end', value: '' };
  constructor(private readonly source: string, private readonly sheet: string) {
    if (!source || source.length > 8000) return unsupported(); this.token = this.next();
  }
  private reference(raw: string, title: string): Token {
    const match = /^\$?([A-Za-z]{1,3})\$?([1-9]\d{0,7})$/.exec(raw); if (!match || (title.includes('[') || title.includes(']')) || title.length > 100) return unsupported();
    const column = [...match[1]!.toUpperCase()].reduce((n,c) => n * 26 + c.charCodeAt(0) - 64, 0); const row = Number(match[2]);
    if (column > 18278 || row > 10000000) return unsupported();
    return { kind: 'reference', value: `${title.toLowerCase()}!${column}:${row}` };
  }
  private next(): Token {
    while (/\s/.test(this.source[this.position] ?? '') && this.position < this.source.length) this.position++;
    if (this.position >= this.source.length) return { kind: 'end', value: '' };
    if (++this.count > 2048) return unsupported();
    const rest = this.source.slice(this.position);
    if ('+-*/()'.includes(rest[0]!)) { this.position++; return { kind: 'symbol', value: rest[0]! }; }
    const number = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(rest);
    if (number) { this.position += number[0].length; if (!Number.isFinite(Number(number[0]))) return unsupported(); return { kind: 'number', value: Number(number[0]).toString() }; }
    const qualified = /^(?:'((?:[^']|'')+)'|([\p{L}_][\p{L}\p{N}_]*))!([$A-Za-z][$A-Za-z0-9]*)/u.exec(rest);
    if (qualified) { this.position += qualified[0].length; return this.reference(qualified[3]!, (qualified[1] ?? qualified[2]!).replaceAll("''", "'")); }
    const reference = /^\$?[A-Za-z]{1,3}\$?[1-9]\d{0,7}/.exec(rest);
    if (reference) { this.position += reference[0].length; return this.reference(reference[0], this.sheet); }
    return unsupported();
  }
  private advance(): Token { const current = this.token; this.token = this.next(); return current; }
  private at(value: string): boolean { return this.token.kind === 'symbol' && this.token.value === value; }
  private unary(depth: number): Expr {
    if (depth > 32) return unsupported();
    if (this.token.kind === 'symbol' && ['+', '-'].includes(this.token.value)) { const op = this.advance().value; return { kind: 'unary', op, child: this.unary(depth + 1) }; }
    if (this.at('(')) {
      this.advance(); const result = this.sum(depth + 1); if (!this.at(')')) return unsupported(); this.advance(); return result;
    }
    if (this.token.kind === 'number' || this.token.kind === 'reference') { const token = this.advance(); return { kind: token.kind as 'number' | 'reference', value: token.value }; }
    return unsupported();
  }
  private product(depth: number): Expr {
    let left = this.unary(depth);
    while (this.token.kind === 'symbol' && ['*', '/'].includes(this.token.value)) { const op = this.advance().value; left = { kind: 'binary', op, left, right: this.unary(depth) }; }
    return left;
  }
  private sum(depth: number): Expr {
    let left = this.product(depth);
    while (this.token.kind === 'symbol' && ['+', '-'].includes(this.token.value)) { const op = this.advance().value; left = { kind: 'binary', op, left, right: this.product(depth) }; }
    return left;
  }
  parse(): Expr { const result = this.sum(0); if (this.token.kind !== 'end') return unsupported(); return result; }
}
function key(node: Expr): string {
  if (node.kind === 'number' || node.kind === 'reference') return `${node.kind}:${node.value}`;
  if (node.kind === 'unary') return node.op === '+' ? key(node.child) : `-(${key(node.child)})`;
  return `${node.op}(${key(node.left)},${key(node.right)})`;
}
function complex(node: Expr): boolean {
  if (node.kind === 'reference') return true;
  if (node.kind === 'number') return false;
  if (node.kind === 'unary') return node.op === '-' || complex(node.child);
  if (['+', '-'].includes(node.op)) return true;
  const containsSum = (value: Expr): boolean => value.kind === 'binary' ? ['+', '-'].includes(value.op) || containsSum(value.left) || containsSum(value.right) : value.kind === 'unary' ? value.op === '-' || containsSum(value.child) : false;
  return containsSum(node);
}
// Inspect only grouping after the parser has validated the expression. Quoted sheet names
// can contain parentheses and escaped apostrophes; those are not arithmetic delimiters.
function groupedAdditions(expression: string): boolean {
  const text = expression.trim(); let depth = 0; let quoted = false; let expectingGroup = true;
  for (let index = 0; index < text.length; index++) {
    const character = text[index]!;
    if (quoted) {
      if (character === "'") {
        if (text[index + 1] === "'") index++;
        else quoted = false;
      }
      continue;
    }
    if (depth > 0 && character === "'") { quoted = true; continue; }
    if (depth === 0) {
      if (/\s/.test(character)) continue;
      if (expectingGroup) {
        if (character !== '(') return false;
        depth = 1; expectingGroup = false;
      } else {
        if (character !== '+') return false;
        expectingGroup = true;
      }
    } else if (character === '(') depth++;
    else if (character === ')') depth--;
  }
  return !quoted && depth === 0 && !expectingGroup;
}
export function appendExpense(cell: SheetCell | undefined, term: string, sheet: string): { formula: string; duplicate: 'none' | 'possible' | 'inconclusive' } {
  const planned = new Parser(term, sheet).parse(); let old: string | undefined;
  if (cell?.error) return unsupported();
  if (cell?.formula !== undefined) { if (!cell.formula.startsWith('=')) return unsupported(); old = cell.formula; }
  else if (cell && cell.value !== null && cell.value !== '') { if (typeof cell.value !== 'number' || !Number.isFinite(cell.value)) return unsupported(); old = `=(${cell.value.toString()})`; }
  let duplicate: 'none' | 'possible' | 'inconclusive' = 'none';
  if (old !== undefined) {
    const root = new Parser(old.slice(1), sheet).parse(); const pending = [root]; const terms: Expr[] = [];
    while (pending.length) { const node = pending.pop()!; if (node.kind === 'binary' && node.op === '+') pending.push(node.left, node.right); else terms.push(node); }
    duplicate = terms.some(node => key(node) === key(planned)) ? 'possible' : terms.some(complex) ? 'inconclusive' : 'none';
  }
  const preserved = old === undefined ? undefined : groupedAdditions(old.slice(1)) ? old : `=(${old.slice(1)})`;
  const formula = preserved === undefined ? `=(${term})` : `${preserved}+(${term})`;
  if (formula.length > 8000) return unsupported(); new Parser(formula.slice(1), sheet).parse();
  return { formula, duplicate };
}
