"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, Bell, Clock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTripStore } from "@/store/useTripStore";

export default function TopbarUser() {
  const { data: session } = useSession();
  const [showNotifications, setShowNotifications] = useState(false);
  const activities = useTripStore(s => s.activities);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  if (session) {
    const userInitial = session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'Y';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button 
            className="icon-button" 
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {activities.length > 0 && (
              <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, backgroundColor: 'var(--primary)', borderRadius: '50%' }} />
            )}
          </button>
          
          {showNotifications && (
            <div style={{ 
              position: 'absolute', right: 0, top: '100%', marginTop: '8px', 
              width: '320px', backgroundColor: 'var(--surface)', 
              border: '1px solid var(--border)', borderRadius: '12px', 
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)', zIndex: 100,
              maxHeight: '400px', overflowY: 'auto'
            }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                Recent Activity
              </div>
              <div style={{ padding: '8px 0' }}>
                {activities.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No recent notifications.
                  </div>
                ) : (
                  activities.slice(0, 10).map((act, i) => (
                    <div key={i} style={{ padding: '12px 16px', display: 'flex', gap: '12px', borderBottom: i === Math.min(activities.length, 10) - 1 ? 'none' : '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-bg">
                      <div style={{ marginTop: '2px', color: 'var(--primary)' }}><Clock size={16} /></div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.4 }}>
                          <strong>{act.user}</strong> {act.action} <span style={{ color: 'var(--text-muted)' }}>{act.target}</span>
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>{act.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button 
          className="icon-button" 
          onClick={() => signOut({ callbackUrl: '/' })} 
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
        <span className="avatar small" title={session.user?.name || session.user?.email || 'User'}>
          {userInitial}
        </span>
      </div>
    );
  }

  return (
    <Link href="/login" className="button primary" style={{ padding: '8px 14px', minHeight: 'auto' }}>
      Sign in
    </Link>
  );
}
