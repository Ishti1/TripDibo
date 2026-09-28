"use client";
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Plus, Search, LayoutGrid, List, Heart, MapPin, CalendarDays, Plane, Compass, CheckCheck, Download, SlidersHorizontal, Sparkles, Route, Pencil, X, Users, Hotel, TrainFront, ExternalLink, Tag } from 'lucide-react';
import { Trip, useTripStore } from '@/store/useTripStore';
import TripForm from '@/components/TripForm';
import Modal from '@/components/Modal';
import TopbarUser from '@/components/TopbarUser';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { covers, inspirations, tripStatus, dateLabel, downloadFile } from '@/lib/travel';
import { getUserTrips } from '@/app/actions/trip';

export default function Page() { return <Suspense fallback={<div className="loading-state">Loading dashboard...</div>}><Dashboard/></Suspense>; }
function Dashboard() {
  const { trips, itinerary, packingList, activities, updateTrip, setCloudTrips } = useTripStore();
  const view = useSearchParams().get('view') || 'overview';
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      getUserTrips().then(trips => setCloudTrips(trips as unknown as Trip[])).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]);

  const heroSceneries = [
    { name: 'Kyoto, Japan', url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=85', link: 'https://en.wikipedia.org/wiki/Kyoto' },
    { name: "Cox's Bazar, Bangladesh", url: 'https://images.unsplash.com/photo-1626239889138-a7e4f971059e?auto=format&fit=crop&w=1600&q=85', link: 'https://en.wikipedia.org/wiki/Cox%27s_Bazar' },
    { name: 'Santorini, Greece', url: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=1600&q=85', link: 'https://en.wikipedia.org/wiki/Santorini' },
    { name: 'Sundarbans, Bangladesh', url: 'https://images.unsplash.com/photo-1608958435020-e8a7109ba809?auto=format&fit=crop&w=1600&q=85', link: 'https://en.wikipedia.org/wiki/Sundarbans' },
    { name: 'Banff, Canada', url: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=1600&q=85', link: 'https://en.wikipedia.org/wiki/Banff_National_Park' },
    { name: 'Bandarban, Bangladesh', url: 'https://images.unsplash.com/photo-1585123388867-3bfe6dd4bdbf?auto=format&fit=crop&w=1600&q=85', link: 'https://en.wikipedia.org/wiki/Bandarban_District' },
    { name: 'Swiss Alps, Switzerland', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85', link: 'https://en.wikipedia.org/wiki/Swiss_Alps' },
    { name: 'Sylhet, Bangladesh', url: 'https://images.unsplash.com/photo-1643001607577-0a0332e79aab?auto=format&fit=crop&w=1600&q=85', link: 'https://en.wikipedia.org/wiki/Sylhet' }
  ];
  const [heroIndex, setHeroIndex] = useState(() => Math.floor(Math.random() * heroSceneries.length));
  useEffect(() => {
    // Loop through them
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroSceneries.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const [modal, setModal] = useState<{ trip?: Trip; initial?: Partial<Trip> } | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All trips');
  const [sort, setSort] = useState('recent');
  const [list, setList] = useState(false);
  const [notice, setNotice] = useState('');
  const upcoming = trips.filter(t => tripStatus(t) !== 'Past');
  const nextTrip = [...upcoming].filter(t => t.startDate).sort((a,b) => a.startDate!.localeCompare(b.startDate!))[0];
  const filtered = trips.filter(t => (view !== 'saved' || t.favorite) && (filter === 'All trips' || tripStatus(t) === filter) && (t.title + ' ' + t.destination).toLowerCase().includes(search.toLowerCase())).sort((a,b) => sort === 'name' ? a.title.localeCompare(b.title) : sort === 'date' ? (a.startDate || '9999').localeCompare(b.startDate || '9999') : 0);
  
  const firstName = session?.user?.name ? session.user.name.split(' ')[0] : 'explorer';

  const [actionModal, setActionModal] = useState<'none' | 'choice' | 'join'>('none');
  const [joinLink, setJoinLink] = useState('');

  const handlePlanTrip = (state?: { trip?: Trip; initial?: Partial<Trip> }) => {
    if (!session) {
      router.push('/login');
      return;
    }
    if (!state || (!state.trip && !state.initial)) {
      setActionModal('choice');
      return;
    }
    setModal(state);
  };

  const handleJoinTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinLink) return;
    
    let tripId = joinLink.trim();
    if (tripId.includes('trip/')) {
      tripId = tripId.split('trip/')[1].split('?')[0].split('#')[0].split('/')[0];
    }
    
    if (tripId) {
      router.push(`/trip/${tripId}`);
      setActionModal('none');
    }
  };

  return <main className="dashboard">
    <div className="topbar"><div className="breadcrumb">Your workspace <span>/</span> <strong>{view === 'saved' ? 'Saved trips' : view === 'explore' ? 'Discover' : view === 'trips' ? 'My trips' : 'Overview'}</strong></div><div className="topbar-actions"><span className="today"><CalendarDays size={14}/>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span><TopbarUser /></div></div>
    <div className="page-heading"><div><span className="eyebrow">A LITTLE PLAN. A GREAT ADVENTURE.</span><h1>{view === 'saved' ? 'Keep the good ones close.' : view === 'explore' ? 'Follow your curiosity.' : view === 'trips' ? 'Your next chapter awaits.' : `Hello, ${firstName}`}{view === 'overview' && <span className="sun-symbol">✺</span>}</h1><p>{view === 'saved' ? 'All your favorite adventures, in one place.' : 'Dream it. Plan it. Make memories along the way.'}</p></div><button className="button primary" onClick={() => handlePlanTrip()}><Plus size={18}/>Plan a trip</button></div>
    {view === 'overview' && <>
      <section className="hero" style={{ backgroundImage: `url(${heroSceneries[heroIndex].url})`, transition: 'background-image 0.5s ease-in-out' }}><div className="hero-shade"/><div className="hero-copy"><span className="hero-kicker"><span/>THE WORLD IS CALLING</span><h2>Go somewhere<br/><em>you’ll never forget.</em></h2><p>Bring your plans, people, and possibilities together.<br/>We’ll help you make room for the good stuff.</p><button className="button light" onClick={() => handlePlanTrip()}>Let’s plan something <ArrowUpRight size={18}/></button></div><a href={heroSceneries[heroIndex].link} target="_blank" rel="noopener noreferrer" className="hero-location" style={{textDecoration: 'underline', zIndex: 10, cursor: 'pointer'}}><MapPin size={14}/> {heroSceneries[heroIndex].name}</a><div className="hero-stamp"><Compass size={31}/><span>GO. WANDER.<br/>COME BACK INSPIRED.</span></div></section>
      <section className="stats-grid" aria-label="Travel overview">
        {[{ icon: Plane, value: String(upcoming.length).padStart(2,'0'), label: 'Trips ahead', note: 'Good things on the horizon', color: 'peach' }, { icon: MapPin, value: String(new Set(trips.map(t => t.destination.toLowerCase())).size).padStart(2,'0'), label: 'Places on your map', note: 'A world of possibilities', color: 'sage' }, { icon: Route, value: String(itinerary.length).padStart(2,'0'), label: 'Plans in the making', note: 'Little moments, big memories', color: 'lavender' }, { icon: CheckCheck, value: packingList.length ? Math.round(packingList.filter(p => p.isCompleted).length / packingList.length * 100) + '%' : '—', label: 'Packed & ready', note: packingList.length ? 'Across all your adventures' : 'Your checklist starts with a trip', color: 'sand' }].map(s => <div className="stat-card" key={s.label}><div className={`stat-icon ${s.color}`}><s.icon size={21}/></div><div><div className="stat-number">{s.value}<span>{s.label}</span></div><p>{s.note}</p></div></div>)}
      </section>
    </>}
    <div className={view === 'overview' ? 'dashboard-columns' : ''}><div className="main-column">
      {view !== 'explore' && <section className="trips-section"><div className="section-heading"><div><h2>{view === 'saved' ? 'Saved adventures' : 'Your adventures'} <span className="count-badge">{view === 'saved' ? trips.filter(t => t.favorite).length : trips.length}</span></h2><p>Every great story starts with a destination.</p></div><div className="view-toggle"><button className={!list ? 'selected' : ''} aria-label="Grid view" aria-pressed={!list} onClick={() => setList(false)}><LayoutGrid size={17}/></button><button className={list ? 'selected' : ''} aria-label="List view" aria-pressed={list} onClick={() => setList(true)}><List size={18}/></button></div></div>
      <div className="trip-toolbar"><div className="filter-tabs">{['All trips','Upcoming','Ongoing','Past'].map(f => <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'active' : ''}>{f}</button>)}</div><label className="sort-control"><SlidersHorizontal size={15}/><select aria-label="Sort trips" value={sort} onChange={e => setSort(e.target.value)}><option value="recent">Recently added</option><option value="date">Departure date</option><option value="name">Trip name</option></select></label></div>
      {(trips.length > 0 || search) && <label className="search-field"><Search size={17}/><input placeholder="Find a trip or destination…" aria-label="Search trips" value={search} onChange={e => setSearch(e.target.value)}/>{search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={15}/></button>}</label>}
      {filtered.length ? <div className={list ? 'trip-grid list-view' : 'trip-grid'}>{filtered.map(trip => <article className="trip-card" key={trip.id}><Link className="trip-image" href={`/trip/${trip.id}`} style={{ backgroundImage: `url(${trip.image})` }} aria-label={`Open ${trip.title}`}><span className="status-pill">{tripStatus(trip)}</span></Link><button className={`favorite-button ${trip.favorite ? 'is-saved' : ''}`} aria-label={`${trip.favorite ? 'Unsave' : 'Save'} ${trip.title}`} aria-pressed={!!trip.favorite} onClick={() => updateTrip(trip.id, { favorite: !trip.favorite })}><Heart size={17} fill={trip.favorite ? 'currentColor' : 'none'}/></button><div className="trip-card-body"><span className="destination"><MapPin size={12}/>{trip.destination}</span><Link href={`/trip/${trip.id}`}><h3>{trip.title}</h3></Link><p><CalendarDays size={13}/>{trip.dates}</p><div className="trip-card-footer"><span><span className="tiny-avatar">Y</span>{trip.members} {trip.members === 1 ? 'traveler' : 'travelers'}</span><div><button className="icon-button" onClick={() => handlePlanTrip({ trip })} aria-label={`Edit ${trip.title}`}><Pencil size={14}/></button><Link className="icon-button" href={`/trip/${trip.id}`} aria-label={`Plan ${trip.title}`}><ArrowUpRight size={18}/></Link></div></div></div></article>)}</div> : <div className="empty-trips"><div className="empty-art"><span className="dashed-orbit"/><span className="empty-plane"><Plane size={29}/></span><span className="little-star">✦</span><span className="little-dot"/></div><h3>{trips.length === 0 ? 'Your next adventure starts here' : 'A little more exploring?'}</h3><p>{trips.length === 0 ? 'A weekend away or a once-in-a-lifetime journey.' : 'No trips match this view just yet.'}<br/>{trips.length === 0 ? 'Give your next escape a place to begin.' : 'Try another filter or plan something new.'}</p><button className="button primary" onClick={() => { if (trips.length && (search || filter !== 'All trips')) { setSearch(''); setFilter('All trips'); } else handlePlanTrip(); }}>{trips.length && (search || filter !== 'All trips') ? 'Reset filters' : 'Create your first plan'}<ArrowUpRight size={16}/></button><span className="empty-footnote">It starts with a destination. The rest is possibility.</span></div>}
      </section>}
      {(view === 'overview' || view === 'explore') && <section className="inspiration-section"><div className="section-heading"><div><span className="eyebrow">A LITTLE WANDERLUST</span><h2>Need a spark of inspiration?</h2></div>{view !== 'explore' && <Link className="text-link" href="/?view=explore">Explore all <ArrowRight size={15}/></Link>}</div><div className="inspiration-grid">{inspirations.map(item => <button key={item.destination} className="inspiration-card" onClick={() => handlePlanTrip({ initial: { title: item.title, destination: item.destination, image: covers[item.cover].url } })}><div className="inspiration-image" style={{ backgroundImage: `url(${covers[item.cover].url})` }}><span>{item.style}</span><span className="inspiration-arrow"><ArrowUpRight size={19}/></span></div><span className="inspiration-tag">{item.tag}</span><h3>{item.title}</h3><p>{item.destination} <span>· {item.days}-day inspiration</span></p></button>)}</div><p className="muted micro">Destination inspiration with illustrative cover photography. Make every detail your own.</p></section>}
    </div>
    {view === 'overview' && <aside className="right-column"><section className="next-card"><div className="section-heading"><h3>On the horizon</h3><Plane size={18}/></div>{nextTrip ? <><span className="eyebrow">YOUR NEXT DEPARTURE</span><h2>{nextTrip.destination}</h2><p>{dateLabel(nextTrip.startDate)}</p><Link className="button secondary" href={`/trip/${nextTrip.id}`}>Pick up your plans <ArrowUpRight size={16}/></Link></> : <><div className="horizon-illustration"><span/><Plane size={27}/></div><h3>Something to look forward to.</h3><p>Add dates to a trip and your next getaway will appear right here.</p><button className="text-link" onClick={() => handlePlanTrip()}>Put it on the calendar <ArrowRight size={15}/></button></>}</section><BookingHelpWidget /><section className="activity-card"><div className="section-heading"><h3>The latest chapter</h3><span className="activity-dot"/></div>{activities.length ? activities.slice(0,3).map(a => <div className="activity-item" key={a.id}><span className="activity-line-dot"/><div><p><strong>{a.user}</strong> {a.action} <strong>{a.target}</strong></p><small>{a.time}</small></div></div>) : <p className="activity-empty">Your travel story is waiting to be written. New plans and updates will appear here.</p>}</section><SpecialOffersWidget /></aside>}
    </div><footer className="dashboard-footer"><span>Made for the journey, not just the destination.</span><span>tripdibo <Compass size={13}/></span></footer>
    {modal && <TripForm trip={modal.trip} initial={modal.initial} onClose={() => setModal(null)}/>}
    {actionModal === 'choice' && (
      <Modal title="Plan your next adventure" subtitle="How would you like to begin?" onClose={() => setActionModal('none')}>
        <div className="choice-modal">
          <button className="choice-button" onClick={() => { setActionModal('none'); setModal({}); }}>
            <span className="choice-icon"><Plus size={24}/></span>
            <div>
              <h3>Create a new trip</h3>
              <p>Start fresh with a blank canvas and invite friends later.</p>
            </div>
            <ArrowRight size={18}/>
          </button>
          <button className="choice-button" onClick={() => setActionModal('join')}>
            <span className="choice-icon"><Users size={24}/></span>
            <div>
              <h3>Collaborate with friends</h3>
              <p>Join an existing trip using a share link or ID.</p>
            </div>
            <ArrowRight size={18}/>
          </button>
        </div>
      </Modal>
    )}
    {actionModal === 'join' && (
      <Modal title="Join an adventure" subtitle="Paste the share link you received from a friend." onClose={() => setActionModal('none')}>
        <form className="form-stack" onSubmit={handleJoinTrip}>
          <label>
            Trip Link
            <input autoFocus required value={joinLink} onChange={e => setJoinLink(e.target.value)} placeholder="https://tripdibo.vercel.app/trip/clk9..."/>
          </label>
          <div className="form-actions">
            <button type="button" className="button" onClick={() => setActionModal('none')}>Cancel</button>
            <button type="submit" className="button primary">Join trip</button>
          </div>
        </form>
      </Modal>
    )}
    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={15}/></button></div>}
  </main>;
}

function BookingHelpWidget() {
  const [helpModal, setHelpModal] = useState(false);
  const helpImages = [
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=400&q=80', // Flight
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80', // Hotel
    'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=400&q=80' // Train
  ];
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setImgIndex(prev => (prev + 1) % helpImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [helpImages.length]);

  return <>
    <section className="booking-help-widget" onClick={() => setHelpModal(true)} style={{ marginTop: '20px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', position: 'relative', border: '1px solid var(--line)', background: 'var(--canvas)', transition: 'transform 0.2s', transform: 'translateY(0)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
      <div style={{ position: 'relative', height: '140px' }}>
        {helpImages.map((src, idx) => (
          <div key={src} style={{ position: 'absolute', inset: 0, backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: imgIndex === idx ? 1 : 0, transition: 'opacity 1.5s ease-in-out' }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 80%)' }} />
      </div>
      <div style={{ padding: '16px', position: 'absolute', bottom: 0, left: 0, right: 0, color: 'white' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 500, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>Need help with bookings? <ExternalLink size={14}/></h3>
        <p style={{ fontSize: '12px', opacity: 0.9, margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Find flights, stays, and transport.</p>
      </div>
    </section>

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
  </>;
}

function SpecialOffersWidget() {
  const partners = [
    { name: 'GoZayaan', url: 'https://www.gozayaan.com', logo: 'https://logo.clearbit.com/gozayaan.com' },
    { name: 'Trip.com', url: 'https://www.trip.com', logo: 'https://logo.clearbit.com/trip.com' },
    { name: 'ShareTrip', url: 'https://sharetrip.net', logo: 'https://logo.clearbit.com/sharetrip.net' },
    { name: 'TripNest', url: '#', icon: true }
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % partners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="next-card" style={{ padding: '20px' }}>
      <div className="section-heading" style={{ marginBottom: '15px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.3px' }}>Special offers</h3>
        <Tag size={18} color="var(--muted)" />
      </div>
      <p style={{ fontSize: '10px', lineHeight: 1.9, color: 'var(--muted)', margin: '0 0 16px' }}>
        Explore special travel deals and discounts across the world from our partners.
      </p>
      
      <div style={{ height: '48px', position: 'relative' }}>
         {partners.map((p, i) => (
            <a 
              key={p.name}
              href={p.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="button secondary"
              style={{
                position: 'absolute',
                inset: 0,
                justifyContent: 'space-between',
                width: '100%',
                opacity: i === index ? 1 : 0,
                transform: `translateY(${i === index ? '0' : '5px'})`,
                transition: 'all 0.4s ease',
                pointerEvents: i === index ? 'auto' : 'none',
                zIndex: i === index ? 10 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {p.icon ? (
                  <div className="brand-mark" style={{ width: '20px', height: '20px', borderRadius: '5px', transform: 'rotate(0)' }}>
                    <Plane size={12} style={{ transform: 'rotate(-14deg)' }}/>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logo} alt={p.name} style={{ width: '20px', height: '20px', objectFit: 'contain', borderRadius: '4px' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                )}
                <strong style={{ fontSize: '11px' }}>{p.name}</strong>
              </div>
              <ExternalLink size={14} color="var(--muted)" />
            </a>
         ))}
      </div>
    </section>
  );
}
