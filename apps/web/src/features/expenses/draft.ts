import { useEffect, useRef, useState } from 'react';
import type { ApiResult, ExpenseClient, ExpenseContext, ExpenseDraft } from '../../api/expenses.js';
export const systemNow = () => new Date();
export function localDate(value: Date): string { return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`; }
function calendar(value: string): Date | null { const result = new Date(value+'T12:00:00Z'); return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(result.getTime()) && result.toISOString().slice(0,10) === value ? result : null; }
export function monthLabel(value: string): string { const date=calendar(value);return date ? new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(date) : 'Selected month'; }
export function selectedDateLabel(value: string, now: Date): string { const date=calendar(value);if(!date)return 'Choose a date';const today=localDate(now);return `${value===today?'Today':value<today?'Past date':'Date'} · ${new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(date)}`; }
export function inputAmount(raw: string): string | null {
  if(raw.length>32 || !/^\d+(?:[.,]\d{1,6})?$/.test(raw))return null;
  const [whole='',fraction='']=raw.replace(',','.').split('.');const integer=whole.replace(/^0+(?=\d)/,'');const decimal=fraction.replace(/0+$/,'');
  return integer.length>9 || integer==='0'&&!decimal ? null : integer+(decimal?'.'+decimal:'');
}
export function inputTotal(values: string[]): string {
  const sum=values.reduce((sum,value)=>{const [whole='0',fraction='']=value.split('.');return sum+BigInt(whole)*1000000n+BigInt(fraction.padEnd(6,'0'));},0n);
  const decimal=(sum%1000000n).toString().padStart(6,'0').replace(/0+$/,'');return (sum/1000000n).toString()+(decimal?'.'+decimal:'');
}
export function useExpenseDraft(client: ExpenseClient, now: () => Date, blocked: {current:boolean}) {
  const [date,setDate]=useState(()=>localDate(now()));const [clock,setClock]=useState(now);
  const [categoryId,setCategory]=useState('');const [currency,setCurrency]=useState('');const [amount,setAmount]=useState('');const [amounts,setAmounts]=useState<string[]>([]);const [comment,setComment]=useState('');
  const [errors,setErrors]=useState<Record<string,string>>({});const [refreshId,setRefresh]=useState(0);
  const [catalog,setCatalog]=useState<{date:string;result:ApiResult<ExpenseContext>|null}>({date,result:null});
  const revision=useRef(0);
  const invalidate=()=>{revision.current++;};
  useEffect(()=>{
    let active=true;revision.current++;setCatalog({date,result:null});
    void client.context(date).then(result=>{
      if(!active)return;setCatalog({date,result});
      if(result.state==='ok'){
        setCategory(value=>result.value.categories.some(category=>category.id===value)?value:'');
        setCurrency(value=>result.value.currencies.some(currency=>currency.code===value)?value:'');
      }
    });
    return()=>{active=false;revision.current++;};
  },[client,date,refreshId]);
  useEffect(()=>{
    const wake=()=>{if(document.visibilityState!=='hidden'&&!blocked.current){setClock(now());setRefresh(value=>value+1);}};
    window.addEventListener('focus',wake);document.addEventListener('visibilitychange',wake);
    return()=>{window.removeEventListener('focus',wake);document.removeEventListener('visibilitychange',wake);};
  },[now,blocked]);
  const context=catalog.date===date && catalog.result?.state==='ok' ? catalog.result.value : null;
  function edit(name:'date'|'categoryId'|'currency'|'amount'|'comment',value:string){if(blocked.current)return;invalidate();setErrors({});({date:setDate,categoryId:setCategory,currency:setCurrency,amount:setAmount,comment:setComment})[name](value);}
  function queue(){if(blocked.current)return;const normalized=inputAmount(amount);if(!normalized || amounts.length>=20){setErrors({amount:amounts.length>=20?'You can add up to 20 amounts.':'Enter a positive amount, with up to 6 decimal places.'});return;}invalidate();setAmounts(values=>[...values,normalized]);setAmount('');setErrors({});}
  function remove(index:number){if(blocked.current)return;invalidate();setAmounts(values=>values.filter((_value,position)=>index!==position));setErrors({});}
  function prepare():ExpenseDraft|null{
    if(blocked.current)return null;
    setClock(now());const problems:Record<string,string>={};const list=[...amounts];
    if(!context || !context.categories.some(category=>category.id===categoryId))problems.categoryId='Choose a category.';
    if(!context || !context.currencies.some(value=>value.code===currency))problems.currency='Choose a currency.';
    if(amount){const normalized=inputAmount(amount);if(!normalized)problems.amount='Enter a positive amount, with up to 6 decimal places.';else list.push(normalized);}
    if(!list.length)problems.amount='Enter an amount.';if(list.length>20)problems.amount='You can add up to 20 amounts.';
    const text=comment.replace(/\r\n?/g,'\n').trim();
    if(new TextEncoder().encode(text).length>1500 || [...text].some(c=>c.charCodeAt(0)<32 && c!=='\n' && c!=='\t' || c.charCodeAt(0)===127))problems.comment='Use a comment of at most 1,500 UTF-8 bytes without control characters.';
    setErrors(problems);if(Object.keys(problems).length)return null;
    invalidate();setAmounts(list);setAmount('');return {date,categoryId,currency,amounts:list,...(text?{comment:text}:{})};
  }
  function clear(){invalidate();setAmounts([]);setAmount('');setComment('');setErrors({});}
  const result=catalog.date===date?catalog.result:null;
  return {date,clock,categoryId,currency,amount,amounts,comment,errors,context,result,revision,edit,queue,remove,prepare,clear,invalidate,refresh:()=>setRefresh(value=>value+1)};
}
