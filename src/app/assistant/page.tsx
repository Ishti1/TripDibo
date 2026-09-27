"use client";
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Plus, Sparkles } from 'lucide-react';
import { useTripStore } from '@/store/useTripStore';
import AssistantPanel from '@/components/AssistantPanel';
import TripForm from '@/components/TripForm';

export default function AssistantPage() {
  const trips = useTripStore(s => s.trips);
  const [selected, setSelected] = useState('');
  const [creating, setCreating] = useState(false);
  const trip = trips.find(t => t.id === selected) || trips[0];
  return <main className="dashboard detail-page">
    <div className="topbar"><div className="breadcrumb"><Link href="/">Your workspace</Link><span>/</span><strong>AI assistant</strong></div></div>
    <div className="page-heading"><div><span className="eyebrow">LESS GUESSWORK. MORE GETAWAY.</span><h1>Your travel thinking partner.</h1><p>Choose a trip. Let Gemini help with the details.</p></div></div>
    {trip ? <><div className="assistant-trip-picker"><label htmlFor="assistant-trip">Planning for<select id="assistant-trip" value={trip.id} onChange={e => setSelected(e.target.value)}>{trips.map(t => <option key={t.id} value={t.id}>{t.title} · {t.destination}</option>)}</select></label><Link className="button secondary" href={'/trip/' + trip.id}>Open trip<ArrowUpRight size={16}/></Link></div><AssistantPanel key={trip.id} trip={trip}/></> : <div className="detail-empty"><Sparkles/><h3>A great trip starts with a little inspiration.</h3><p>Add your destination, dates, and budget. Gemini can then help you build an itinerary and plan around your bookings.</p><button className="button primary" onClick={() => setCreating(true)}><Plus size={16}/>Create a trip for AI planning</button></div>}
    {creating && <TripForm onClose={() => setCreating(false)} onSaved={setSelected}/>}
  </main>;
}
