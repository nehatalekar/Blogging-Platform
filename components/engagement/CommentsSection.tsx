'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, Trash2 } from 'lucide-react';

interface Comment {
  id: number;
  content: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    profileImage?: string;
  };
  createdAt: string;
}

interface CommentsSectionProps {
  blogId: number;
  onCommentCountChange?: (count: number) => void;
}

export default function CommentsSection({ blogId, onCommentCountChange }: CommentsSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [blogId, showComments]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/engagement/comment?blogId=${blogId}`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      alert('Please sign in to comment');
      return;
    }

    if (!session.user.isVerified) {
      alert('Please verify your email to comment');
      return;
    }

    if (!commentText.trim()) {
      alert('Comment cannot be empty');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/engagement/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogId, content: commentText }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to add comment');
        return;
      }

      const data = await res.json();
      setComments([data.comment, ...comments]);
      setCommentText('');
      onCommentCountChange?.(comments.length + 1);
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const res = await fetch(`/api/engagement/comment?commentId=${commentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        alert('Failed to delete comment');
        return;
      }

      setComments(comments.filter((c) => c.id !== commentId));
      onCommentCountChange?.(comments.length - 1);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Something went wrong');
    }
  };

  return (
    <div className="mt-8 border-t pt-8">
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-2 text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors"
      >
        <MessageCircle size={24} />
        <span>Comments ({comments.length})</span>
      </button>

      {showComments && (
        <div className="mt-6 space-y-6">
          {/* Comment Form */}
          {session?.user ? (
            <form onSubmit={handleAddComment} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                rows={3}
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
                >
                  {submitting ? '⏳ Posting...' : '💬 Post Comment'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-blue-50 p-6 rounded-xl text-center border-2 border-blue-200">
              <p className="text-gray-600 font-medium">🔐 Sign in to join the conversation</p>
              <a href="/login" className="text-blue-600 hover:text-blue-700 text-sm font-semibold mt-2 inline-block">
                Login here →
              </a>
            </div>
          )}

          {/* Comments List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-3">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-5xl mb-3 opacity-40">💭</p>
              <p className="text-gray-500 font-medium">No comments yet</p>
              <p className="text-gray-400 text-sm mt-2">Be the first to comment on this post</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white p-5 rounded-lg border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm">
                        {comment.user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{comment.user.fullName}</p>
                        <p className="text-sm text-gray-500">@{comment.user.username}</p>
                      </div>
                    </div>
                    {session?.user && session.user.id && parseInt(session.user.id as string) === comment.user.id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                        title="Delete comment"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-3">{comment.content}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
