"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TopbarUser() {
  const { data: session } = useSession();
  
  if (session) {
    const userInitial = session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'Y';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
