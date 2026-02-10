'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Heart, Bookmark, MessageCircle } from 'lucide-react';

interface LikeButtonProps {
  blogId: number;
  onLikeChange?: (liked: boolean, count: number) => void;
}

export default function LikeButton({ blogId, onLikeChange }: LikeButtonProps) {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLikes();
  }, [blogId]);

  const fetchLikes = async () => {
    try {
      const res = await fetch(`/api/engagement/like?blogId=${blogId}`);
      const data = await res.json();
      setLikeCount(data.count || 0);
      if (session?.user && session.user.id) {
        const userLiked = data.likes?.some((like: any) => like.user.id === parseInt(session.user!.id as string));
        setIsLiked(userLiked || false);
      }
    } catch (error) {
      console.error('Failed to fetch likes:', error);
    }
  };

  const handleLike = async () => {
    if (!session?.user) {
      alert('Please sign in to like this blog');
      return;
    }

    if (!session.user.isVerified) {
      alert('Please verify your email to like blogs');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/engagement/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogId }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to like blog');
        return;
      }

      const data = await res.json();
      const newIsLiked = data.action === 'liked';
      setIsLiked(newIsLiked);
      setLikeCount(newIsLiked ? likeCount + 1 : likeCount - 1);
      onLikeChange?.(newIsLiked, newIsLiked ? likeCount + 1 : likeCount - 1);
    } catch (error) {
      console.error('Failed to like blog:', error);
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
        isLiked
          ? 'bg-red-100 text-red-600 hover:bg-red-200 shadow-sm'
          : 'bg-white text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
      <span>{likeCount}</span>
    </button>
  );
}
