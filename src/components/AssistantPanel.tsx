"use client";
import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, Route, Wallet, Package, Check, RefreshCw, Square, MessageCircle, Cloud, ChevronDown } from 'lucide-react';
import { Trip, useTripStore } from '@/store/useTripStore';
import type { AssistantMessage, AssistantProposal } from '@/lib/planning-types';
import { planningContext } from '@/lib/assistant';
import { money } from '@/lib/travel';
type Status={ready:boolean;configured:boolean;connected:boolean;model:string;message:string};
export default function AssistantPanel({ trip }: { trip: Trip }) {
  const store=useTripStore();
  const messages=store.assistantMessages.filter(m=>m.tripId===trip.id);
  const [input,setInput]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  const [status,setStatus]=useState<Status|null>(null); const [checking,setChecking]=useState(false);
  const controller=useRef<AbortController|null>(null); const scrollEnd=useRef<HTMLDivElement|null>(null);
  const context=planningContext({trip,bookings:store.bookings.filter(b=>b.tripId===trip.id),itinerary:store.itinerary.filter(i=>i.tripId===trip.id),expenses:store.expenses.filter(e=>e.tripId===trip.id),packing:store.packingList.filter(p=>p.tripId===trip.id)});
  useEffect(()=>{const c=new AbortController();fetch('/api/assistant',{signal:c.signal}).then(r=>r.json()).then(setStatus).catch(()=>{});return()=>{c.abort();controller.current?.abort();};},[]);
  useEffect(()=>{scrollEnd.current?.scrollIntoView({block:'nearest'});},[messages.length,busy]);
  async function checkStatus() {setChecking(true);try{const r=await fetch('/api/assistant');setStatus(await r.json());}catch{setError('Could not check the Gemini connection.');}finally{setChecking(false);}}
  async function send(value=input) {
    if(busy || !value.trim())return;
    if(!status?.ready){setError(status?.message || 'Check the Gemini connection before sending a message.');return;}
    setError('');setBusy(true);setInput('');
    const history=messages.slice(-7).map(m=>({role:m.role,content:m.proposal?JSON.stringify(m.proposal):m.content}));
    store.addAssistantMessage({tripId:trip.id,role:'user',content:value.trim()});
    const abort=new AbortController();controller.current=abort;
    try{
      const response=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},signal:abort.signal,body:JSON.stringify({context,messages:[...history,{role:'user',content:value.trim()}]})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||'The assistant could not respond.');
      const proposal=data.proposal as AssistantProposal;
      store.addAssistantMessage({tripId:trip.id,role:'assistant',content:proposal.answer,proposal,currency:trip.currency||'USD'});
    }catch(e){setError(e instanceof Error && e.name==='AbortError'?'Request stopped. Your saved plans have not changed.':e instanceof Error?e.message:'Could not reach the assistant.');setInput(value);}
    finally{setBusy(false);controller.current=null;}
  }
  return <section className="assistant-panel">
    <div className="section-heading"><div><span className="eyebrow">A THOUGHTFUL TRAVEL COMPANION</span><h2><Sparkles size={22}/>TripDibo assistant</h2><p>Plan around what’s booked. Leave room for what’s next.</p></div><span className="privacy-chip"><Cloud size={13}/>Powered by Gemini</span></div>
    <div className="assistant-layout"><aside className="assistant-context"><span className="assistant-avatar"><Bot size={28}/></span><h3>Let’s make this<br/>a great trip.</h3><p>I can help shape your itinerary, build a budget, and prepare a packing list from your saved trip details.</p><div className="context-facts"><span><Route size={15}/>{context.itinerary.length} existing plans</span><span><Check size={15}/>{context.bookings.length} active bookings</span><span><Wallet size={15}/>{money(context.totals.knownCommitment,context.trip.currency)} known costs</span></div><details><summary>What the assistant sees <ChevronDown size={13}/></summary><p>Google Gemini receives your chat, trip dates, destination, traveler count, budget, itinerary, booking schedules and costs, expenses, and packing item names. Ticket files, PNRs, traveler names, and booking notes are excluded. Chat text is sent as written.</p></details><div className={`ai-connection ${status?.ready?'ready':''}`}><span/><strong>{status?.ready?'Gemini connected':status?'Setup needed':'Checking connection…'}</strong><button className="icon-button" disabled={checking} onClick={checkStatus} aria-label="Check AI connection"><RefreshCw size={14} className={checking?'spin':''}/></button></div><small>{status?.model || 'Gemini'}</small></aside>
    <div className="assistant-main">
      {status && !status.ready && <div className="ai-setup" role="status"><Cloud size={20}/><div><strong>{status.message}</strong>{!status.configured && <><p>Get a key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>, add <code>GEMINI_API_KEY</code> to <code>.env.local</code>, and restart the app.</p><span>Keep your key on the server. Never paste it into chat.</span></>}<p>Use “Check AI connection” after updating setup.</p></div></div>}
      <div className="assistant-messages" aria-live="polite" aria-busy={busy}>
        {!messages.length && <div className="assistant-welcome"><MessageCircle size={31}/><h3>A little help, a better adventure.</h3><p>Tell me your interests, pace, and budget. I’ll use your bookings as the starting point.</p><div className="prompt-suggestions"><button disabled={busy||!status?.ready} onClick={()=>send('Create a relaxed itinerary for the first three days of this trip, around my existing bookings.')}><Route size={18}/><strong>Shape my itinerary</strong><span>Work around booked stays and journeys</span></button><button disabled={busy||!status?.ready} onClick={()=>send('Build a realistic total-trip budget in my trip currency for all travelers. Include existing expenses and unrecorded bookings exactly once, and show category estimates.')}><Wallet size={18}/><strong>Build my budget</strong><span>Know what’s booked and what’s left</span></button><button disabled={busy||!status?.ready} onClick={()=>send('Review my saved bookings and itinerary for timing conflicts, missing details, and things I should prepare.')}><Check size={18}/><strong>Check my plans</strong><span>Spot gaps before departure</span></button></div></div>}
        {messages.map(m=><article className={`chat-message ${m.role}`} key={m.id}><div className="chat-author">{m.role==='assistant'?<Bot size={16}/>:<span className="tiny-avatar">Y</span>}<strong>{m.role==='assistant'?'TripDibo':'You'}</strong></div><p>{m.content}</p>{m.proposal && <Proposal message={m} trip={trip}/>}</article>)}
        {busy && <div className="assistant-working"><span className="spinner"/><span>Gemini is thinking through your trip…<small>Your draft will appear here when it’s ready.</small></span><button className="button secondary" onClick={()=>controller.current?.abort()}><Square size={12}/>Stop</button></div>}
        <div ref={scrollEnd}/>
      </div>
      {error && <div className="assistant-error" role="alert">{error}</div>}
      <form className="assistant-compose" onSubmit={e=>{e.preventDefault();send();}}><label className="sr-only" htmlFor="assistant-input">Message the travel assistant</label><textarea id="assistant-input" maxLength={3000} rows={2} placeholder="e.g. We love local food. Plan 3 easy days and keep costs under our budget…" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}/><button className="button primary" type="submit" disabled={busy||!status?.ready||!input.trim()} aria-label="Send message"><Send size={17}/></button></form><p className="assistant-footnote">Chat and selected trip details are sent to Google Gemini. Suggestions are drafts with estimated costs; you choose what to save.</p>
    </div></div>
  </section>;
}
function Proposal({message,trip}:{message:AssistantMessage;trip:Trip}) {
  const store=useTripStore();const proposal=message.proposal!;
  const [feedback,setFeedback]=useState('');
  const sameCurrency=message.currency===(trip.currency||'USD');
  function applyBudget() {
    const budget=proposal.budget;
    if(!budget || !sameCurrency)return;
    const current=useTripStore.getState();
    const latest=planningContext({trip,bookings:current.bookings.filter(b=>b.tripId===trip.id),expenses:current.expenses.filter(e=>e.tripId===trip.id)});
    if(budget.total<latest.totals.knownCommitment){setFeedback('Your known costs have increased beyond this draft. Ask for an updated budget.');return;}
    store.updateTrip(trip.id,{budget:budget.total,budgetPlan:budget});
    store.updateAssistantMessage(message.id,{appliedBudget:true});
    setFeedback('Budget saved. Your existing expenses are unchanged.');
  }
  function applyPlans() {
    if(!sameCurrency){setFeedback('The trip currency changed. Ask for a fresh plan first.');return;}
    const current=useTripStore.getState();
    if(proposal.itinerary.some(p=>!trip.startDate||p.date<trip.startDate||(trip.endDate&&p.date>trip.endDate))){setFeedback('Trip dates changed. Ask for an updated itinerary.');return;}
    let count=0;
    for(const p of proposal.itinerary) {
      if(current.itinerary.some(i=>i.tripId===trip.id&&i.title.toLowerCase()===p.title.toLowerCase()&&i.date===p.date&&i.time===p.time))continue;
      store.addItineraryItem({...p,tripId:trip.id,estimatedCost:money(p.estimatedCost,trip.currency)});count++;
    }
    store.updateAssistantMessage(message.id,{appliedItinerary:true});setFeedback(count+' new plans added. Existing matching plans were kept.');
  }
  return <div className="ai-proposals">
    {proposal.warnings.length>0&&<div className="proposal-notes">{proposal.warnings.map((w,i)=><p key={i}>{w}</p>)}</div>}
    {proposal.itinerary.length>0&&<div className="proposal-card"><header><Route size={17}/><h4>Itinerary draft</h4><span>{proposal.itinerary.length} plans</span></header>{proposal.itinerary.map((p,i)=><div className="proposed-plan" key={i}><span>{p.date}<strong>{p.time}</strong></span><div><strong>{p.title}</strong><p>{p.location} · {money(p.estimatedCost,trip.currency)} estimated</p>{p.notes&&<small>{p.notes}</small>}</div></div>)}<button className="button secondary" disabled={message.appliedItinerary||!sameCurrency} onClick={applyPlans}>{message.appliedItinerary?<Check size={15}/>:<PlusIcon/>}{message.appliedItinerary?'Added to itinerary':'Add these plans'}</button></div>}
    {proposal.budget&&<div className="proposal-card"><header><Wallet size={17}/><h4>Budget draft</h4><span>All travelers</span></header>{proposal.budget.categories.map((c,i)=><div className="proposed-budget" key={i}><div><strong>{c.name}</strong><p>{c.reason}</p></div><strong>{money(c.amount,proposal.budget!.currency)}</strong></div>)}<div className="budget-total"><span>Estimated total</span><strong>{money(proposal.budget.total,proposal.budget.currency)}</strong></div>{proposal.budget.assumptions.map((a,i)=><p key={i} className="proposal-assumption">{a}</p>)}<button className="button secondary" disabled={message.appliedBudget||!sameCurrency} onClick={applyBudget}>{message.appliedBudget?<Check size={15}/>:<Wallet size={15}/>} {message.appliedBudget?'Budget saved':'Use this budget'}</button></div>}
    {proposal.packing.length>0&&<div className="proposal-card"><header><Package size={17}/><h4>Packing suggestions</h4></header><ul>{proposal.packing.map(p=><li key={p}>{p}</li>)}</ul><button className="button secondary" disabled={message.appliedPacking} onClick={()=>{const current=useTripStore.getState().packingList;proposal.packing.filter(p=>!current.some(i=>i.tripId===trip.id&&i.title.toLowerCase()===p.toLowerCase())).forEach(title=>store.addPackingItem({tripId:trip.id,title,assignedTo:'You'}));store.updateAssistantMessage(message.id,{appliedPacking:true});setFeedback('Packing suggestions added. Existing matching items were skipped.');}}><Check size={15}/>{message.appliedPacking?'Added to packing list':'Add packing items'}</button></div>}
    {feedback&&<p className="proposal-feedback" role="status">{feedback}</p>}
    {!sameCurrency&&<p className="form-error">Trip currency changed. Request a fresh proposal before applying costs.</p>}
  </div>;
}
function PlusIcon(){return <span aria-hidden="true" style={{fontSize:18,lineHeight:1}}>+</span>;}
