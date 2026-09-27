"use client";
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Compass, LayoutGrid, Heart, Map, ArrowUpRight, Moon, Plane, Globe2, Sparkles, LogOut, LogIn } from 'lucide-react';
import { Suspense } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTripStore } from '@/store/useTripStore';
function Navigation() {
  const params = useSearchParams(); const path = usePathname(); const current = params.get('view') || 'overview';
  return <nav className="main-nav" aria-label="Main navigation">{[{ key: 'overview', href: '/', label: 'Overview', icon: LayoutGrid }, { key: 'trips', href: '/?view=trips', label: 'My trips', icon: Map }, { key: 'saved', href: '/?view=saved', label: 'Saved trips', icon: Heart }, { key: 'assistant', href: '/assistant', label: 'AI assistant', icon: Sparkles }, { key: 'explore', href: '/?view=explore', label: 'Discover', icon: Compass }].map(item => <Link key={item.key} href={item.href} className={(path === '/' && current === item.key) || (path.startsWith('/trip') && item.key === 'trips') || (path === '/assistant' && item.key === 'assistant') ? 'active' : ''}><item.icon size={19}/><span>{item.label}</span>{item.key === 'explore' && <span className="nav-new">NEW</span>}</Link>)}</nav>;
}
export default function Header({ toggleDarkMode }: { toggleDarkMode: () => void }) {
  const count = useTripStore(s => s.trips.length);
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Your workspace';
  const userInitial = session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'Y';
  return <><aside className="sidebar"><Link href="/" className="brand"><span className="brand-mark"><Plane size={23}/></span>tripdibo<span className="brand-dot">.</span></Link><div className="workspace-label">YOUR TRAVEL SPACE</div><Suspense><Navigation/></Suspense><div className="sidebar-note"><div className="orbit-icon"><Globe2 size={36}/><span>✦</span></div><h3>Less planning.<br/>More living.</h3><p>Your next great story<br/>starts with a little curiosity.</p><Link href="/?view=explore">Find your inspiration <ArrowUpRight size={15}/></Link></div><div className="sidebar-bottom"><div className="local-status"><span/>{session ? 'Synced with cloud' : 'Saved on this device'}</div><button className="profile-button" onClick={toggleDarkMode} title="Switch light or dark appearance">{session?.user?.image ? <img src={session.user.image} alt="Avatar" className="avatar" style={{ objectFit: 'cover' }}/> : <span className="avatar">{userInitial}</span>}<span><strong>{userName}</strong><small>{count} {count === 1 ? 'adventure' : 'adventures'} and counting</small></span><Moon size={17}/></button></div></aside><header className="mobile-header"><Link className="brand" href="/"><span className="brand-mark"><Plane size={20}/></span>tripdibo.</Link><button className="icon-button" onClick={toggleDarkMode} aria-label="Toggle color theme"><Moon size={19}/></button></header><div className="mobile-navigation"><Suspense><Navigation/></Suspense></div></>;
}
