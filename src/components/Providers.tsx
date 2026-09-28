"use client";
import { SessionProvider } from "next-auth/react";
import { createContext, useContext, useEffect, useState } from 'react';
import Header from './Header';
import { useTripStore } from '@/store/useTripStore';
import { Toaster } from 'react-hot-toast';

const ThemeContext = createContext({ darkMode: false, toggleDarkMode: () => {} });
export const useTheme = () => useContext(ThemeContext);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    try { useTripStore.persist.rehydrate(); } catch (e) { console.warn('Store rehydration failed', e); }
    try {
      const dark = localStorage.getItem('theme') === 'dark';
      document.documentElement.classList.toggle('dark', dark);
      setDarkMode(dark);
    } catch (e) { console.warn('localStorage access failed', e); }
    setMounted(true);
  }, []);

  const toggleDarkMode = () => {
    const next = !document.documentElement.classList.contains('dark');
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch (e) {}
  };

  return (
    <SessionProvider>
      <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
        <Toaster position="bottom-right" toastOptions={{ style: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' } }} />
        <Header toggleDarkMode={toggleDarkMode} />
        <div className="app-content">
          {mounted ? children : <div className="loading-state">Preparing your next adventure…</div>}
        </div>
      </ThemeContext.Provider>
    </SessionProvider>
  );
}
