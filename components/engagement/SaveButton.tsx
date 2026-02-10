'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bookmark } from 'lucide-react';

interface SaveButtonProps {
  blogId: number;
  onSaveChange?: (saved: boolean) => void;
}

export default function SaveButton({ blogId, onSaveChange }: SaveButtonProps) {
  const { data: session } = useSession();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchSaveStatus();
    }
  }, [blogId, session?.user]);

  const fetchSaveStatus = async () => {
    try {
      const res = await fetch(`/api/engagement/save?blogId=${blogId}`);
      const data = await res.json();
      setIsSaved(data.isSaved || false);
    } catch (error) {
      console.error('Failed to fetch save status:', error);
    }
  };

  const handleSave = async () => {
    if (!session?.user) {
      alert('Please sign in to save this blog');
      return;
    }

    if (!session.user.isVerified) {
      alert('Please verify your email to save blogs');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/engagement/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogId }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to save blog');
        return;
      }

      const data = await res.json();
      const newIsSaved = data.action === 'saved';
      setIsSaved(newIsSaved);
      onSaveChange?.(newIsSaved);
    } catch (error) {
      console.error('Failed to save blog:', error);
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
        isSaved
          ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 shadow-sm'
          : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
      <span>{isSaved ? '✓ Saved' : 'Save'}</span>
    </button>
  );
}
