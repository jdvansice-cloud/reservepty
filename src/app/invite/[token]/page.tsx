'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const supabase = createClient();
  
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'accepted' | 'error'>('loading');
  const [invitation, setInvitation] = useState<any>(null);
  const [orgName, setOrgName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function checkInvitation() {
      try {
        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);

        // Fetch invitation details
        const response = await fetch(`/api/invitations/verify?token=${token}`);
        if (!response.ok) { setStatus('invalid'); return; }
        
        const data = await response.json();
        setInvitation(data.invitation);
        setOrgName(data.orgName);
        setStatus('valid');
      } catch (error) {
        setStatus('error');
      }
    }
    checkInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!isLoggedIn) {
      // Redirect to signup with return URL
      router.push(`/signup?redirect=/invite/${token}`);
      return;
    }

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        setStatus('accepted');
        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    } finally {
      setProcessing(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2b4a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#c8b273] animate-spin" />
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2b4a] flex items-center justify-center p-6">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h1>
          <p className="text-white/60 mb-6">This invitation link is invalid or has expired.</p>
          <Link href="/" className="text-[#c8b273] hover:underline">Go to Home</Link>
        </div>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2b4a] flex items-center justify-center p-6">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Welcome!</h1>
          <p className="text-white/60">You have joined {orgName}. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2b4a] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10 text-center">
          <div className="w-16 h-16 bg-[#c8b273] rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-[#0a1628] font-bold text-2xl">R</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">You're Invited!</h1>
          <p className="text-white/60 mb-6">
            You've been invited to join <span className="text-[#c8b273] font-semibold">{orgName}</span> on ReservePTY as a <span className="capitalize">{invitation?.role}</span>.
          </p>
          <button
            onClick={handleAccept}
            disabled={processing}
            className="w-full bg-[#c8b273] text-[#0a1628] py-3 rounded-lg font-semibold hover:bg-[#d4c088] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing && <Loader2 className="w-5 h-5 animate-spin" />}
            {isLoggedIn ? 'Accept Invitation' : 'Sign Up to Accept'}
          </button>
          {!isLoggedIn && (
            <p className="text-white/50 text-sm mt-4">
              Already have an account? <Link href={`/login?redirect=/invite/${token}`} className="text-[#c8b273] hover:underline">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
