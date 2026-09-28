"use client";
import { useState } from 'react';
import { Hotel, Plane, Bus, TrainFront, Car, Ticket, Plus, Pencil, Trash2, MapPin, ArrowRight, Paperclip, Download, ExternalLink, Check, CalendarPlus, X } from 'lucide-react';
import { Trip, useTripStore } from '@/store/useTripStore';
import type { Booking, BookingKind, TicketFile } from '@/lib/planning-types';
import { bookingDate, bookingLabels, validBooking } from '@/lib/bookings';
import { downloadTicket, removeTicket, saveTicket } from '@/lib/ticket-files';
import { money } from '@/lib/travel';
import { currencies } from '@/lib/currencies';
import Modal from './Modal';
const icons = { hotel: Hotel, flight: Plane, bus: Bus, train: TrainFront, car: Car, other: Ticket };

export default function BookingsPanel({ trip }: { trip: Trip }) {
  const store = useTripStore();
  const [editing, setEditing] = useState<Booking | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Booking | null>(null);
  const [filter, setFilter] = useState<BookingKind | 'all'>('all');
  const [notice, setNotice] = useState('');
  const [helpModal, setHelpModal] = useState(false);
  const bookings = store.bookings.filter(b => b.tripId === trip.id).sort((a,b) => a.start.localeCompare(b.start));
  const visible = bookings.filter(b => filter === 'all' || b.kind === filter);
  const total = bookings.filter(b => b.status !== 'cancelled' && b.currency === (trip.currency || 'USD')).reduce((s,b) => s + b.cost, 0);
  function addToTimeline(b: Booking) {
    const existing = store.itinerary.find(i => i.bookingId === b.id);
    const data = { title: b.title, date: b.start.slice(0,10), time: b.start.slice(11,16), category: b.kind === 'hotel' ? 'hotel' as const : 'transport' as const, location: b.kind === 'hotel' ? b.address || b.title : [b.from,b.to].filter(Boolean).join(' → '), estimatedCost: money(b.cost,b.currency), notes: 'Linked booking. Times are local to the departure or check-in location.', bookingId: b.id };
    if (existing) store.updateItineraryItem(existing.id,data); else store.addItineraryItem({ ...data, tripId: trip.id });
    setNotice(existing ? 'Linked itinerary entry updated.' : 'Booking added to your itinerary.');
  }
  return <section className="bookings-panel">
    <div className="section-heading"><div><span className="eyebrow">EVERY CONFIRMATION, ONE PLACE</span><h2>Bookings & tickets</h2><p>Your stays, journeys, and the little details that get you there.</p></div><button className="button primary" onClick={() => setEditing('new')}><Plus size={16}/>Add booking</button></div>
    <div className="booking-overview"><span className="plan-icon"><Ticket size={23}/></span><div><strong>{bookings.length} saved {bookings.length === 1 ? 'booking' : 'bookings'}</strong><p>{money(total,trip.currency)} booked · excludes cancellations and other currencies</p></div><span className="privacy-chip">Stored on this device</span></div>
    <div className="booking-filters">{(['all','hotel','flight','bus','train','car','other'] as const).map(kind => <button key={kind} className={filter === kind ? 'active' : ''} onClick={() => setFilter(kind)}>{kind === 'all' ? 'All bookings' : bookingLabels[kind]}</button>)}</div>
    {visible.length ? <div className="booking-grid">{visible.map(b => { const Icon = icons[b.kind]; return <article className={`booking-card ${b.status === 'cancelled' ? 'cancelled' : ''}`} key={b.id}>
      <header><span className="booking-kind"><Icon size={19}/>{bookingLabels[b.kind]}</span><span className={`booking-status ${b.status}`}>{b.status}</span><button className="icon-button" aria-label={`Edit booking ${b.title}`} onClick={() => setEditing(b)}><Pencil size={15}/></button><button className="icon-button" aria-label={`Remove booking ${b.title}`} onClick={() => setDeleting(b)}><Trash2 size={15}/></button></header>
      <h3>{b.title}</h3><p className="booking-provider">{b.provider}{b.serviceNumber && ` · ${b.serviceNumber}`}</p>
      {b.kind !== 'hotel' && <div className="booking-route"><span>{b.from || 'Departure'}</span><ArrowRight size={18}/><span>{b.to || 'Arrival'}</span></div>}
      {b.kind === 'hotel' && b.address && <p className="booking-address"><MapPin size={14}/>{b.address}</p>}
      <div className="booking-dates"><div><span>{b.kind === 'hotel' ? 'CHECK-IN' : 'DEPARTURE'}</span><strong>{bookingDate(b.start)}</strong><small>{b.startTimezone || 'Local time'}</small></div><div><span>{b.kind === 'hotel' ? 'CHECK-OUT' : 'ARRIVAL'}</span><strong>{bookingDate(b.end)}</strong><small>{b.endTimezone || 'Local time'}</small></div></div>
      <div className="booking-reference"><span>Confirmation / PNR<strong>{b.reference || 'Not added'}</strong></span><span>{b.kind === 'hotel' ? 'Room / guests' : 'Seat / class'}<strong>{b.seat || 'Not assigned'}</strong></span></div>
      <details className="booking-details"><summary>Traveler, notes & documents {b.attachments.length > 0 && `(${b.attachments.length})`}</summary><p><strong>Traveler:</strong> {b.traveler || 'Not added'}</p>{b.notes && <p className="booking-notes">{b.notes}</p>}{b.url && <a className="text-link" href={b.url} target="_blank" rel="noopener noreferrer">Open booking page <ExternalLink size={13}/></a>}<div className="ticket-list">{b.attachments.map(f => <button key={f.id} onClick={() => downloadTicket(f).catch(e => setNotice(e.message))}><Paperclip size={14}/><span>{f.name}</span><Download size={14}/></button>)}</div></details>
      <footer><div><strong>{money(b.cost,b.currency)}</strong><span>{b.recordExpense ? 'Included in expenses' : 'Not recorded as an expense'}</span></div>{b.status !== 'cancelled' && <button className="text-link" onClick={() => addToTimeline(b)}><CalendarPlus size={14}/>{store.itinerary.some(i => i.bookingId === b.id) ? 'Update timeline' : 'Add to timeline'}</button>}</footer>
    </article>; })}</div> : <div className="detail-empty"><Ticket/><h3>{bookings.length ? 'No bookings in this category.' : 'All booked? Keep it together.'}</h3><p>Save hotel reservations, air tickets, bus and train journeys, confirmation numbers, and ticket documents.</p><button className="button secondary" onClick={() => setEditing('new')}><Plus size={15}/>Save a booking</button></div>}
    
    <div style={{ textAlign: 'center', marginTop: '32px' }}>
      <button className="text-link" onClick={() => setHelpModal(true)}>Need help with bookings? <ExternalLink size={12} style={{marginLeft: '4px'}}/></button>
    </div>

    {helpModal && <Modal title="Need help with bookings?" subtitle="Find the best flights, stays, and transport for your trip." onClose={() => setHelpModal(false)}>
      <div className="booking-sites" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="site-group">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><Plane size={15}/> Flights</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a href="https://www.google.com/flights" target="_blank" rel="noreferrer" className="button secondary" style={{ flex: '1 1 auto', justifyContent: 'center' }}>Google Flights</a>
            <a href="https://www.skyscanner.net/" target="_blank" rel="noreferrer" className="button secondary" style={{ flex: '1 1 auto', justifyContent: 'center' }}>Skyscanner</a>
            <a href="https://www.kayak.com/flights" target="_blank" rel="noreferrer" className="button secondary" style={{ flex: '1 1 auto', justifyContent: 'center' }}>Kayak</a>
          </div>
        </div>
        <div className="site-group">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><Hotel size={15}/> Hotels & Stays</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a href="https://www.booking.com/" target="_blank" rel="noreferrer" className="button secondary" style={{ flex: '1 1 auto', justifyContent: 'center' }}>Booking.com</a>
            <a href="https://www.airbnb.com/" target="_blank" rel="noreferrer" className="button secondary" style={{ flex: '1 1 auto', justifyContent: 'center' }}>Airbnb</a>
            <a href="https://www.agoda.com/" target="_blank" rel="noreferrer" className="button secondary" style={{ flex: '1 1 auto', justifyContent: 'center' }}>Agoda</a>
          </div>
        </div>
        <div className="site-group">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}><TrainFront size={15}/> Trains & Buses</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a href="https://www.rome2rio.com/" target="_blank" rel="noreferrer" className="button secondary" style={{ flex: '1 1 auto', justifyContent: 'center' }}>Rome2rio</a>
            <a href="https://www.thetrainline.com/" target="_blank" rel="noreferrer" className="button secondary" style={{ flex: '1 1 auto', justifyContent: 'center' }}>Trainline</a>
            <a href="https://www.omio.com/" target="_blank" rel="noreferrer" className="button secondary" style={{ flex: '1 1 auto', justifyContent: 'center' }}>Omio</a>
          </div>
        </div>
      </div>
      <div className="modal-footer"><button className="button secondary" onClick={() => setHelpModal(false)}>Close</button></div>
    </Modal>}

    {editing && <BookingForm trip={trip} booking={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSaved={() => setNotice('Booking saved, including any attached tickets.')}/>}
    {deleting && <Modal title="Remove this booking?" subtitle="Recorded expenses are kept. Attached ticket files will be removed from this browser." onClose={() => setDeleting(null)}><p>{deleting.title}</p><div className="modal-footer"><button className="button secondary" onClick={() => setDeleting(null)}>Keep booking</button><button className="button danger" onClick={async () => { const target=deleting; try { await Promise.all(target.attachments.map(f => removeTicket(f.id))); store.deleteBooking(target.id); setDeleting(null); setNotice('Booking removed. Any recorded payment remains in expenses.'); } catch { setNotice('Could not remove the ticket files. Please try again.'); } }}>Remove booking</button></div></Modal>}
    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={15}/></button></div>}
  </section>;
}

function BookingForm({ trip, booking, onClose, onSaved }: { trip: Trip; booking?: Booking; onClose: () => void; onSaved: () => void }) {
  const saveBooking = useTripStore(s => s.saveBooking);
  const [form,setForm] = useState<Omit<Booking,'id'|'tripId'>>(booking || { kind:'hotel', title:'', provider:'', reference:'', serviceNumber:'', traveler:'', seat:'', from:'', to:'', start:trip.startDate ? trip.startDate + 'T14:00' : '', end:'', startTimezone:'', endTimezone:'', address:'', status:'confirmed', cost:0, currency:trip.currency || 'USD', paidBy:'You', recordExpense:false, notes:'', url:'', attachments:[] });
  const [costPer, setCostPer] = useState<'group'|'person'>('person');
  const [files,setFiles] = useState<File[]>([]); const [error,setError] = useState(''); const [saving,setSaving] = useState(false);
  const set = <K extends keyof typeof form>(key: K,value: typeof form[K]) => setForm(f => ({...f,[key]:value}));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); const validation = validBooking(form); if (validation) { setError(validation); return; }
    if (form.recordExpense && form.currency !== (trip.currency || 'USD')) { setError('Update this booking to the trip currency before recording its cost.'); return; }
    setSaving(true); setError(''); const added: TicketFile[] = [];
    try {
      for (const file of files) added.push(await saveTicket(file));
      const finalCost = costPer === 'group' && form.cost ? Number(form.cost) / (trip.members || 1) : form.cost;
      saveBooking({ ...form, cost: finalCost, title:form.title.trim(), tripId:trip.id, id:booking?.id, attachments:[...form.attachments,...added] });
      const removed = booking?.attachments.filter(f => !form.attachments.some(kept => kept.id === f.id)) || [];
      await Promise.allSettled(removed.map(f => removeTicket(f.id)));
      onSaved(); onClose();
    } catch (e) { await Promise.allSettled(added.map(f => removeTicket(f.id))); setError(e instanceof Error ? e.message : 'Could not save this booking.'); } finally { setSaving(false); }
  }
  return <Modal title={booking ? 'Your booking, in detail.' : 'Save the details. Enjoy the trip.'} subtitle="Keep reservations and tickets close at hand." onClose={() => { if (!saving) onClose(); }}><form className="form-stack" onSubmit={submit}>
    <div className="form-grid"><label>Booking type<select value={form.kind} onChange={e => set('kind',e.target.value as BookingKind)}>{Object.entries(bookingLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label><label>Status<select value={form.status} onChange={e => set('status',e.target.value as Booking['status'])}><option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option></select></label></div>
    <label>{form.kind === 'hotel' ? 'Hotel / property name' : 'Booking name'}<input required maxLength={150} value={form.title} placeholder={form.kind === 'hotel' ? 'e.g. The seaside hotel' : 'e.g. Flight to Bangkok'} onChange={e => set('title',e.target.value)}/></label>
    <div className="form-grid"><label>{form.kind === 'hotel' ? 'Booking platform / contact' : 'Airline / operator'}<input maxLength={120} value={form.provider} onChange={e => set('provider',e.target.value)}/></label><label>Confirmation / PNR<input maxLength={80} value={form.reference} placeholder="Your booking reference" onChange={e => set('reference',e.target.value)}/></label></div>
    {form.kind !== 'hotel' && <><div className="form-grid"><label>From<input maxLength={150} value={form.from} placeholder="Airport, station, or pickup point" onChange={e => set('from',e.target.value)}/></label><label>To<input maxLength={150} value={form.to} placeholder="Destination terminal or station" onChange={e => set('to',e.target.value)}/></label></div><label>Flight / train / service number<input maxLength={60} value={form.serviceNumber} placeholder="e.g. BG 388" onChange={e => set('serviceNumber',e.target.value)}/></label></>}
    {form.kind === 'hotel' && <label>Property address<input maxLength={300} value={form.address} onChange={e => set('address',e.target.value)}/></label>}
    <div className="form-grid"><label>{form.kind === 'hotel' ? 'Check-in' : 'Departure'}<input type="datetime-local" required value={form.start} onInput={e => set('start',e.currentTarget.value)}/></label><label>{form.kind === 'hotel' ? 'Check-out' : 'Arrival'}<input type="datetime-local" value={form.end} onInput={e => set('end',e.currentTarget.value)}/></label></div>
    <div className="form-grid"><label>Start timezone / UTC offset<input maxLength={50} placeholder="e.g. UTC+06:00" value={form.startTimezone} onChange={e => set('startTimezone',e.target.value)}/></label><label>End timezone / UTC offset<input maxLength={50} placeholder="e.g. UTC+07:00" value={form.endTimezone} onChange={e => set('endTimezone',e.target.value)}/></label></div>
    <div className="form-grid"><label>Traveler / guest name<input maxLength={120} value={form.traveler} onChange={e => set('traveler',e.target.value)}/></label><label>{form.kind === 'hotel' ? 'Room type / guest count' : 'Seat / class'}<input maxLength={100} value={form.seat} onChange={e => set('seat',e.target.value)}/></label></div>
    <div className="form-grid three"><label>Cost ({form.currency}) <select style={{display:'inline', width:'auto', padding:'2px 4px', fontSize:'9px', marginLeft:'6px', background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--muted)'}} value={costPer} onChange={e=>setCostPer(e.target.value as 'group'|'person')}><option value="group">Total</option><option value="person">Per traveler</option></select><input type="number" min="0" step="0.01" required value={form.cost} onChange={e => set('cost', e.target.value === '' ? ('' as any) : Number(e.target.value))}/></label><label>Booking currency<select value={form.currency} onChange={e => set('currency',e.target.value)}>{currencies.map(c => <option key={c.code}>{c.code}</option>)}</select></label><label>Paid by<input maxLength={80} value={form.paidBy} onChange={e => set('paidBy',e.target.value)}/></label></div>
    {form.currency !== (trip.currency || 'USD') && <p className="muted micro">This booking uses a different currency. To include it in expenses, enter its cost in {trip.currency || 'USD'} and select that currency. Amounts are not converted automatically.</p>}
    <label className="inline-check"><input type="checkbox" checked={form.recordExpense} onChange={e => set('recordExpense',e.target.checked)}/>Record this cost in trip expenses</label><p className="muted micro">A linked expense stays in sync when you edit the booking. Unchecking removes that linked expense. Cancellation alone does not erase a recorded payment.</p>
    <label>Booking link<input type="url" maxLength={1000} placeholder="https://…" value={form.url} onChange={e => set('url',e.target.value)}/></label><label>Notes<textarea rows={2} maxLength={2000} value={form.notes} placeholder="Baggage, check-in instructions, cancellation policy…" onChange={e => set('notes',e.target.value)}/></label>
    <label className="ticket-upload"><Paperclip size={17}/>Attach tickets or confirmations<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple onChange={e => { const picked=Array.from(e.target.files || []); if (picked.length + form.attachments.length > 3) { setError('Attach up to 3 files per booking.'); e.target.value=''; return; } setFiles(picked); setError(''); }}/><span>PDF or images · up to 5 MB each · 3 files per booking</span></label>
    <div className="ticket-list">{form.attachments.map(f => <div key={f.id}><Paperclip size={13}/><span>{f.name}</span><button type="button" aria-label={`Remove attachment ${f.name}`} onClick={() => set('attachments',form.attachments.filter(a => a.id !== f.id))}><X size={14}/></button></div>)}{files.map((f,i) => <div key={i}><Paperclip size={13}/><span>{f.name}</span><button type="button" aria-label={`Remove new file ${f.name}`} onClick={() => setFiles(files.filter((_,index) => index !== i))}><X size={14}/></button></div>)}</div>
    <p className="muted micro">Files stay in this browser. JSON exports contain file names, not the files themselves.</p>
    {error && <p className="form-error" role="alert">{error}</p>}<div className="modal-footer"><button className="button secondary" type="button" disabled={saving} onClick={onClose}>Cancel</button><button className="button primary" type="submit" disabled={saving}><Check size={16}/>{saving ? 'Saving files…' : 'Save booking'}</button></div>
  </form></Modal>;
}
