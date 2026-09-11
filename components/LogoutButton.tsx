'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setVisible(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setVisible(Boolean(session)));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        setBusy(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.assign('/login');
      }}
      disabled={busy}
      aria-label="Log out"
      style={{
        position: 'fixed', right: 18, bottom: 18, zIndex: 1000,
        padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,.14)',
        background: 'rgba(10,20,16,.96)', color: 'inherit', cursor: busy ? 'wait' : 'pointer',
        boxShadow: '0 10px 30px rgba(0,0,0,.22)', fontWeight: 700,
      }}
    >
      {busy ? 'Logging out…' : 'Log out'}
    </button>
  );
}
