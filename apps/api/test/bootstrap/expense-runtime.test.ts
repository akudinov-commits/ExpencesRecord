import { expect, test, vi } from 'vitest';
import { createConfiguredApp } from '../../src/bootstrap/runtime.js';
import { sessionCodec } from '../../src/infrastructure/auth-crypto.js';
import { parseAuthConfiguration } from '../../src/bootstrap/auth-config.js';
import { authEnvironment } from '../support/config.js';
import { mappingEnvironment } from '../support/mapping.js';
import { writeMappingInput } from '../support/registration.js';
import type { SheetCell, SheetReader } from '../../src/application/ports/workbook.js';
import type { ExpenseWriter } from '../../src/application/ports/expenses.js';
async function headers(){const c=parseAuthConfiguration(authEnvironment);const now=Math.floor(Date.now()/1000);return {origin:c.appOrigin,'x-csrf-token':'synthetic-csrf',cookie:`__Host-expences_session=${await sessionCodec(c.sessionKey,c.appOrigin).seal({subject:c.allowedSubject,version:c.sessionVersion,csrf:'synthetic-csrf',issuedAt:now,expiresAt:now+604800})}`};}
const input={date:'2020-01-15',amount:'5',categoryId:'groceries',currency:'KZT'};
function fixture(flag: string|undefined='true'){
 const cells:SheetCell[]=[{row:1,column:3,value:'Synthetic groceries'},{row:16,column:1,value:(Date.UTC(2020,0,15)-Date.UTC(1899,11,30))/86400000},{row:39,column:6,value:7}];
 const readCredentials={get:vi.fn(async()=>({subject:authEnvironment.GOOGLE_ALLOWED_SUBJECT,accessToken:'synthetic-read'}))};const writeCredentials={get:vi.fn(async()=>({subject:authEnvironment.GOOGLE_ALLOWED_SUBJECT,accessToken:'synthetic-write'}))};
 const reader={listSheets:vi.fn<SheetReader['listSheets']>().mockResolvedValue([{title:'Synthetic January',sheetId:0,rowCount:65,columnCount:30}]),readCells:vi.fn<SheetReader['readCells']>().mockImplementation(async(_id,_title,b)=>structuredClone(cells.filter(c=>c.row>=b.startRow&&c.row<=b.endRow&&c.column>=b.startColumn&&c.column<=b.endColumn)))};
 const writer={execute:vi.fn<ExpenseWriter['execute']>().mockResolvedValue({expense:'saved',comment:'not_requested'})};
 const env={...authEnvironment,...mappingEnvironment(writeMappingInput()),...(flag===undefined?{}:{EXPENSE_WRITES_ENABLED:flag})};
 return {env,reader,readCredentials,writeCredentials,writer};
}
test('portable runtime connects application preview and exact writes using independent credentials',async()=>{
 const f=fixture();const app=createConfiguredApp(f.env,false,undefined,f);try{
 const h=await headers();const preview=await app.inject({method:'POST',url:'/api/expenses/preview',headers:h,payload:input});expect(preview.statusCode).toBe(200);expect(preview.json()).toMatchObject({canSave:true,proposedFormula:'=(5)'});expect(f.readCredentials.get).toHaveBeenCalledOnce();expect(f.writeCredentials.get).not.toHaveBeenCalled();
 const save=await app.inject({method:'POST',url:'/api/expenses',headers:h,payload:{...input,expectedVersion:preview.json().expectedVersion}});expect(save.statusCode).toBe(201);expect(f.writeCredentials.get).toHaveBeenCalledOnce();expect(f.writer.execute).toHaveBeenCalledExactlyOnceWith({spreadsheetId:'synthetic-workbook-id',sheetId:0,row:16,column:3,formula:'=(5)'},'synthetic-write');
 }finally{await app.close();}
});
test.each([undefined,'false','TRUE','invalid'])('write flag %s fails closed while preview/auth/health stay usable',async flag=>{
 const f=fixture(flag);if(flag===undefined)delete f.env.EXPENSE_WRITES_ENABLED;
 const app=createConfiguredApp(f.env,false,undefined,f);try{const h=await headers();const response=await app.inject({method:'POST',url:'/api/expenses/preview',headers:h,payload:input});expect(response.statusCode).toBe(200);expect(response.json()).toMatchObject({canSave:false,blockedReason:'writes_unavailable'});
 expect((await app.inject({method:'POST',url:'/api/expenses',headers:h,payload:{...input,expectedVersion:response.json().expectedVersion}})).statusCode).toBe(503);expect(f.writeCredentials.get).not.toHaveBeenCalled();expect(f.writer.execute).not.toHaveBeenCalled();expect((await app.inject('/api/health')).statusCode).toBe(200);expect((await app.inject({url:'/api/auth/session',headers:h})).statusCode).toBe(200);
 }finally{await app.close();}
});
test('missing writer grant does not fall back to the read-only credential',async()=>{
 const f=fixture();const app=createConfiguredApp(f.env,false,{credentials:f.readCredentials,reader:f.reader},{writer:f.writer});try{const h=await headers();const response=await app.inject({method:'POST',url:'/api/expenses/preview',headers:h,payload:input});expect(response.statusCode).toBe(200);expect(response.json()).toMatchObject({canSave:false,blockedReason:'writes_unavailable'});expect(f.writer.execute).not.toHaveBeenCalled();}finally{await app.close();}
});
test.each([undefined,'{invalid'])('unavailable mapping %s fails only the feature',async raw=>{
 const f=fixture();const env={...authEnvironment,EXPENSE_WRITES_ENABLED:'true',...(raw===undefined?{}:{EXPENSE_WORKBOOKS_JSON:raw})};const app=createConfiguredApp(env,false,undefined,f);try{const response=await app.inject({method:'POST',url:'/api/expenses/preview',headers:await headers(),payload:input});expect(response.statusCode).toBe(503);expect(response.json()).toEqual({error:{code:'mapping_unavailable'}});expect((await app.inject('/api/health')).statusCode).toBe(200);}finally{await app.close();}
});
