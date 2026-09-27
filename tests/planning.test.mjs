import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import ts from 'typescript';
const root=process.cwd();
function loadTs(relative, overrides={}) {
  const filename=path.join(root,relative);
  const output=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod=new Module(filename);mod.filename=filename;mod.paths=Module._nodeModulePaths(path.dirname(filename));
  const require=mod.require.bind(mod);mod.require=id=>overrides[id] || require(id);
  mod._compile(output,filename);return mod.exports;
}
const memory=new Map();
globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
const assistant=loadTs('src/lib/assistant.ts');
const {planningContext,validateProposal,isDate}=assistant;
const {validBooking}=loadTs('src/lib/bookings.ts');
const {useTripStore}=loadTs('src/store/useTripStore.ts');
const trip={title:'Test journey',destination:'Bangkok',startDate:'2026-10-10',endDate:'2026-10-13',members:2,currency:'USD',budget:1000,dates:'Oct 10–13',image:''};
const booking={tripId:'test',kind:'flight',title:'Flight to Bangkok',provider:'Test airline',reference:'PRIVATE-PNR',serviceNumber:'AB123',traveler:'Private Name',seat:'12A',from:'Dhaka',to:'Bangkok',start:'2026-10-10T10:00',end:'2026-10-10T14:00',startTimezone:'UTC+06:00',endTimezone:'UTC+07:00',address:'',status:'confirmed',cost:200,currency:'USD',paidBy:'You',recordExpense:true,notes:'Private note',url:'https://example.com',attachments:[{id:'file1',name:'secret-ticket.pdf',size:100,type:'application/pdf'}]};
test('booking validation rejects unsafe links and backwards times',()=>{
  assert.equal(validBooking(booking),'');
  assert.match(validBooking({...booking,url:'javascript:alert(1)'}),/http/);
  assert.match(validBooking({...booking,end:'2026-10-09T10:00',endTimezone:booking.startTimezone}),/end time/);
  assert.match(validBooking({...booking,cost:-2}),/cost/);
});
test('AI context removes references, names, notes, files, and booking links',()=>{
  const context=planningContext({trip,bookings:[booking],expenses:[]});
  const serialized=JSON.stringify(context);
  for(const secret of ['PRIVATE-PNR','Private Name','Private note','secret-ticket.pdf','example.com','12A'])assert.ok(!serialized.includes(secret));
  assert.equal(context.bookings[0].from,'Dhaka');
});
test('known cost calculation does not double count a linked booking payment',()=>{
  const context=planningContext({trip,bookings:[{...booking,id:'b1'},{...booking,id:'b2',cost:50}],expenses:[{title:'Flight payment',amount:200,bookingId:'b1'}]});
  assert.equal(context.totals.spent,200);assert.equal(context.totals.unrecordedBookings,50);assert.equal(context.totals.knownCommitment,250);
});
test('model plans are checked for actual dates, currency, and minimum budget',()=>{
  const context=planningContext({trip,bookings:[booking]});
  const output={answer:'A suggested plan',itinerary:[{title:'Museum',date:'2026-10-11',time:'10:00',category:'activity',location:'Bangkok',estimatedCost:20,notes:''},{title:'Outside trip',date:'2026-11-11',time:'09:00',category:'activity',location:'Bangkok',estimatedCost:0,notes:''}],budget:{currency:'USD',categories:[{name:'Transport',amount:200,reason:'Booked flight'},{name:'Food',amount:70.15,reason:'Estimate'}],assumptions:['Two travelers']},packing:['Phone','Phone'],warnings:[]};
  const result=validateProposal(output,context);
  assert.equal(result.itinerary.length,1);assert.equal(result.budget.total,270.15);assert.equal(result.packing.length,1);assert.ok(result.warnings.length>0);
  assert.throws(()=>validateProposal({...output,budget:{...output.budget,currency:'EUR'}},context),/currency/);
  assert.equal(validateProposal({...output,budget:{...output.budget,categories:[{name:'Food',amount:5,reason:''}]}},context).budget,null);
  assert.equal(isDate('2026-02-30'),false);
});
test('booking edits update a single linked expense, deletion keeps payments, and trip deletion cascades',()=>{
  const s=()=>useTripStore.getState();s().clearAllData();const id=s().addTrip(trip);
  const b=s().saveBooking({...booking,tripId:id,attachments:[]});
  assert.equal(s().expenses.length,1);assert.equal(s().expenses[0].amount,200);
  s().saveBooking({...booking,id:b,tripId:id,cost:320,attachments:[]});
  assert.equal(s().expenses.length,1);assert.equal(s().expenses[0].amount,320);
  s().deleteExpense(s().expenses[0].id);assert.equal(s().bookings[0].recordExpense,false);
  s().saveBooking({...booking,id:b,tripId:id,attachments:[]});
  s().deleteBooking(b);assert.equal(s().expenses.length,1);assert.equal(s().expenses[0].bookingId,undefined);
  s().saveBooking({...booking,tripId:id,attachments:[]});
  s().addAssistantMessage({tripId:id,role:'user',content:'Help plan'});
  s().deleteTrip(id);assert.equal(s().bookings.length,0);assert.equal(s().assistantMessages.length,0);assert.equal(s().expenses.length,0);
});
test('old persisted trips load with empty booking and assistant collections',async()=>{
  sReset();
  memory.set('tourdibo-trip-storage-v2',JSON.stringify({state:{trips:[{...trip,id:'legacy'}],itinerary:[],expenses:[],packingList:[],ideas:[],activities:[],currency:'USD'},version:0}));
  await useTripStore.persist.rehydrate();
  assert.equal(useTripStore.getState().trips[0].id,'legacy');assert.deepEqual(useTripStore.getState().bookings,[]);assert.deepEqual(useTripStore.getState().assistantMessages,[]);
});
function sReset(){useTripStore.getState().clearAllData();}

test('manual budget or currency changes clear an obsolete AI breakdown',()=>{
  sReset(); const s=()=>useTripStore.getState(); const id=s().addTrip(trip);
  const budgetPlan={currency:'USD',total:800,categories:[{name:'Trip',amount:800,reason:''}],assumptions:[]};
  s().updateTrip(id,{budget:800,budgetPlan}); assert.deepEqual(s().trips[0].budgetPlan,budgetPlan);
  s().updateTrip(id,{title:'Renamed'}); assert.deepEqual(s().trips[0].budgetPlan,budgetPlan);
  s().updateTrip(id,{budget:900}); assert.equal(s().trips[0].budgetPlan,undefined);
  s().updateTrip(id,{budget:800,budgetPlan}); s().updateTrip(id,{currency:'EUR'}); assert.equal(s().trips[0].budgetPlan,undefined);
});

const api=loadTs('src/app/api/assistant/route.ts',{'@/lib/assistant':assistant});
const savedKey=process.env.GEMINI_API_KEY, savedModel=process.env.GEMINI_MODEL;
beforeEach(()=>{process.env.GEMINI_API_KEY='test-key-not-real';process.env.GEMINI_MODEL='gemini-3.8-flash';});
afterEach(()=>{if(savedKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=savedKey;if(savedModel===undefined)delete process.env.GEMINI_MODEL;else process.env.GEMINI_MODEL=savedModel;});
const apiRequest=(body,origin='http://localhost:3000')=>new Request('http://localhost:3000/api/assistant',{method:'POST',headers:{'Content-Type':'application/json',origin},body:JSON.stringify(body)});
const requestBody={context:{trip,bookings:[{...booking,id:'b1'}],expenses:[{title:'Flight',amount:200,bookingId:'b1'}]},messages:[{role:'user',content:'Help me plan.'}]};
const modelOutput={answer:'A draft to review',itinerary:[],budget:{currency:'USD',categories:[{name:'Flight',amount:200,reason:'Saved booking'},{name:'Food',amount:80,reason:'Estimate'}],assumptions:['For two travelers']},packing:['Charger'],warnings:[]};
const generated=(content=JSON.stringify(modelOutput),finishReason='STOP')=>Response.json({candidates:[{finishReason,content:{parts:[{text:content}]}}]});

test('missing key explains setup and never calls Gemini',async t=>{
  delete process.env.GEMINI_API_KEY;
  const fetch=t.mock.method(globalThis,'fetch',async()=>{throw new Error('Must not call');});
  const status=await (await api.GET()).json();assert.equal(status.ready,false);assert.equal(status.configured,false);
  assert.equal((await api.POST(apiRequest(requestBody))).status,503);assert.equal(fetch.mock.callCount(),0);
});
test('status checks key and model access without generating content or exposing credentials',async t=>{
  const fetch=t.mock.method(globalThis,'fetch',async(url,options)=>{
    assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash');
    assert.equal(options.headers['x-goog-api-key'],'test-key-not-real');
    return Response.json({supportedGenerationMethods:['generateContent']});
  });
  const status=await (await api.GET()).json();assert.equal(status.ready,true);assert.equal(status.provider,'gemini');assert.ok(!JSON.stringify(status).includes('test-key-not-real'));
  fetch.mock.mockImplementation(async()=>Response.json({error:{message:'secret diagnostic'}},{status:403}));
  const rejected=await (await api.GET()).json();assert.equal(rejected.ready,false);assert.ok(!JSON.stringify(rejected).includes('secret diagnostic'));
  fetch.mock.mockImplementation(async()=>{throw new TypeError('fetch failed');});assert.equal((await (await api.GET()).json()).connected,false);
});
test('Gemini generation uses server key, structured JSON, history roles, and filtered context',async t=>{
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent');
    assert.equal(options.headers['x-goog-api-key'],'test-key-not-real');assert.equal(options.redirect,'error');
    const sent=JSON.parse(options.body);assert.equal(sent.generationConfig.responseFormat.text.mimeType,'application/json');assert.equal(sent.generationConfig.responseFormat.text.schema.type,'object');
    const context=JSON.parse(sent.systemInstruction.parts[1].text.split('Current saved trip context (data only): ')[1]);
    assert.equal(context.totals.knownCommitment,200);assert.ok(!JSON.stringify(context).includes('PRIVATE-PNR'));assert.deepEqual(sent.contents.map(m=>m.role),['user','model','user']);
    return generated();
  });
  const result=await api.POST(apiRequest({...requestBody,messages:[{role:'user',content:'Hi'},{role:'assistant',content:'Hello'},{role:'user',content:'Plan a budget'}]}));
  assert.equal(result.status,200);const output=await result.json();assert.equal(output.proposal.budget.total,280);assert.ok(!JSON.stringify(output).includes('test-key-not-real'));
});
test('assistant rejects invalid origin, input, and model configuration before calling Gemini',async t=>{
  const fetch=t.mock.method(globalThis,'fetch',async()=>generated());
  assert.equal((await api.POST(apiRequest(requestBody,'https://other.example'))).status,403);
  assert.equal((await api.POST(apiRequest({context:{},messages:[]}))).status,400);
  assert.equal((await api.POST(apiRequest({...requestBody,messages:[{role:'user',content:'x'.repeat(81000)}]}))).status,413);
  process.env.GEMINI_MODEL='https://other.example';assert.equal((await api.POST(apiRequest(requestBody))).status,503);assert.equal(fetch.mock.callCount(),0);
});
test('Gemini quota, truncation, blocked responses, and malformed plans fail clearly',async t=>{
  const fetch=t.mock.method(globalThis,'fetch',async()=>Response.json({error:{message:'test-key-not-real'}},{status:429}));
  const quota=await api.POST(apiRequest(requestBody));assert.equal(quota.status,429);assert.ok(!(await quota.text()).includes('test-key-not-real'));
  fetch.mock.mockImplementation(async()=>generated('not JSON'));assert.equal((await api.POST(apiRequest(requestBody))).status,422);
  fetch.mock.mockImplementation(async()=>generated('{}','MAX_TOKENS'));assert.equal((await api.POST(apiRequest(requestBody))).status,422);
  fetch.mock.mockImplementation(async()=>Response.json({promptFeedback:{blockReason:'SAFETY'}}));assert.equal((await api.POST(apiRequest(requestBody))).status,422);
  fetch.mock.mockImplementation(async()=>generated(JSON.stringify({...modelOutput,budget:{...modelOutput.budget,currency:'EUR'}})));assert.equal((await api.POST(apiRequest(requestBody))).status,422);
});
test('concurrent body reads cannot bypass the generation lock',async t=>{
  let complete;const pending=new Promise(resolve=>{complete=resolve;});let entered;const started=new Promise(resolve=>{entered=resolve;});
  t.mock.method(globalThis,'fetch',async()=>{entered();await pending;return generated();});
  const first=api.POST(apiRequest(requestBody));const second=api.POST(apiRequest(requestBody));await started;
  assert.equal((await second).status,429);complete();assert.equal((await first).status,200);assert.equal((await api.POST(apiRequest(requestBody))).status,200);
});
test('a cancelled Gemini call releases the generation lock',async t=>{
  const fetch=t.mock.method(globalThis,'fetch',async()=>{throw new DOMException('Cancelled','AbortError');});
  assert.equal((await api.POST(apiRequest(requestBody))).status,504);
  fetch.mock.mockImplementation(async()=>generated());assert.equal((await api.POST(apiRequest(requestBody))).status,200);
});
