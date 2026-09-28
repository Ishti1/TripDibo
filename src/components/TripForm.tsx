"use client";
import { useState } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import Modal from './Modal';
import { Trip, useTripStore } from '@/store/useTripStore';
import { covers, dateLabel } from '@/lib/travel';
import { currencies } from '@/lib/currencies';
export default function TripForm({ trip, initial, onClose, onSaved }: { trip?: Trip; initial?: Partial<Trip>; onClose: () => void; onSaved?: (id: string) => void }) {
  const { addTrip, updateTrip, currency } = useTripStore();
  const [form, setForm] = useState({ title: trip?.title || initial?.title || '', destination: trip?.destination || initial?.destination || '', startDate: trip?.startDate || '', endDate: trip?.endDate || '', members: trip?.members || 1, image: trip?.image || initial?.image || covers[0].url, description: trip?.description || '', currency: trip?.currency || currency, budget: trip?.budget || 0 });
  const [budgetPer, setBudgetPer] = useState<'group'|'person'>('person');
  const [error, setError] = useState('');
  return <Modal title={trip ? 'Fine-tune your getaway' : 'Where to next?'} subtitle="Big adventures start with a little plan." onClose={onClose}>
    <form className="form-stack" onSubmit={e => { e.preventDefault(); if (!form.title.trim() || !form.destination.trim()) { setError('Add a trip name and destination.'); return; } if (form.endDate && (!form.startDate || form.endDate < form.startDate)) { setError('Choose an end date on or after your start date.'); return; } const finalBudget = budgetPer === 'group' && form.budget ? Number(form.budget) / Number(form.members || 1) : form.budget; const data = { ...form, budget: finalBudget, title: form.title.trim(), destination: form.destination.trim(), dates: form.startDate ? `${dateLabel(form.startDate)}${form.endDate ? ` – ${dateLabel(form.endDate)}` : ''}` : 'Flexible dates' }; const id = trip ? (updateTrip(trip.id, data), trip.id) : addTrip(data); onSaved?.(id); onClose(); }}>
      <label>Trip name<input autoFocus required maxLength={90} placeholder="e.g. Our great summer escape" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></label>
      <label>Destination<input required maxLength={120} placeholder="City, region, or somewhere you've dreamed of" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })}/></label>
      <div className="form-grid"><label>Departure<input type="date" value={form.startDate} onInput={e => setForm({ ...form, startDate: e.currentTarget.value })}/></label><label>Return<input type="date" min={form.startDate} value={form.endDate} onInput={e => setForm({ ...form, endDate: e.currentTarget.value })}/></label></div>
      <div className="form-grid three"><label>Travelers<input type="number" min="1" max="100" required value={form.members} onChange={e => setForm({ ...form, members: e.target.value === '' ? ('' as any) : Number(e.target.value) })}/></label><label>Currency<select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>{currencies.map(c => <option key={c.code}>{c.code}</option>)}</select></label><label>Trip budget <select style={{display:'inline', width:'auto', padding:'2px 4px', fontSize:'9px', marginLeft:'6px', background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--muted)'}} value={budgetPer} onChange={e=>setBudgetPer(e.target.value as 'group'|'person')}><option value="group">Total</option><option value="person">Per traveler</option></select><input type="number" min="0" step="0.01" value={form.budget} placeholder="Optional" onChange={e => setForm({ ...form, budget: e.target.value === '' ? ('' as any) : Number(e.target.value) })}/></label></div>
      <label>A note to your future self<textarea rows={2} maxLength={600} placeholder="The places, moments, and memories you're here for…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></label>
      <fieldset><legend>Set the mood</legend><div className="cover-picker">{covers.map(cover => <button key={cover.name} type="button" title={cover.name} aria-label={`${cover.name} cover`} aria-pressed={form.image === cover.url} onClick={() => setForm({ ...form, image: cover.url })} style={{ backgroundImage: `url(${cover.url})` }}>{form.image === cover.url && <Check size={20}/>}<span>{cover.name}</span></button>)}</div></fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-footer"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" type="submit">{trip ? 'Save changes' : 'Create trip'}<ArrowUpRight size={17}/></button></div>
    </form>
  </Modal>;
}
