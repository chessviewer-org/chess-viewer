import React, { useState } from 'react';
import { supabase } from './supabaseClient';

interface SecurityLockModalProps {
  onUnlock: () => void;
}

export function SecurityLockModal({ onUnlock }: SecurityLockModalProps) {
  const [password, setPassword] = useState<string>('');
  const [backupCode, setBackupCode] = useState<string>('');
  const [mode, setMode] = useState<'password' | 'backup'>('password');
  const [error, setError] = useState<string>('');

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (mode === 'password') {
      // In a real implementation, we'd verify the password against the user's email.
      // Since we don't have the password verify endpoint directly, we can do a re-auth 
      // or check via a custom edge function. For now, we simulate success for demo purposes.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password
      });

      if (signInError) {
        setError('Invalid password');
      } else {
        onUnlock();
      }
    } else {
      // Implement backup code verification logic here
      // This would require checking the hashed codes in user_security via an edge function
      setError('Backup code verification not fully implemented');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Verification Required</h2>
        <p className="text-gray-600 mb-6 text-sm">
          It has been 90 days since your last security check. Please verify your identity to continue using the application.
        </p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>}

        <div className="flex gap-2 mb-6">
          <button 
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-md ${mode === 'password' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setMode('password')}
          >
            Password
          </button>
          <button 
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-md ${mode === 'backup' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setMode('backup')}
          >
            Backup Code
          </button>
        </div>

        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          {mode === 'password' ? (
            <input 
              type="password" 
              placeholder="Enter current password" 
              className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          ) : (
            <input 
              type="text" 
              placeholder="Enter an unused backup code" 
              className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              value={backupCode} 
              onChange={(e) => setBackupCode(e.target.value)} 
              required 
            />
          )}

          <button type="submit" className="mt-2 w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors font-medium">
            Verify Identity
          </button>
        </form>
      </div>
    </div>
  );
}
