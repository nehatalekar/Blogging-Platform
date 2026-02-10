'use client';

import React, { useState } from 'react';
import LikeButton from './LikeButton';
import SaveButton from './SaveButton';
import { MessageCircle } from 'lucide-react';

interface EngagementBarProps {
  blogId: number;
  onCommentsClick?: () => void;
  commentCount?: number;
}

export default function EngagementBar ({
  blogId,
  onCommentsClick,
  commentCount = 0,
}: EngagementBarProps) {
  const [displayCommentCount, setDisplayCommentCount] = useState(commentCount);

  return (
    <div className="flex gap-2 my-8 flex-wrap bg-gray-50 p-4 rounded-lg border border-gray-200">
      <LikeButton blogId={blogId} />
      
      <button
        onClick={onCommentsClick}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all border border-gray-200 font-medium"
      >
        <MessageCircle size={18} />
        <span>{displayCommentCount}</span>
      </button>

      <SaveButton blogId={blogId} />
    </div>
  );
}
