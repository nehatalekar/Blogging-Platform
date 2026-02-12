'use client';

import React, { useState } from 'react';
import EngagementBar from '@/components/engagement/EngagementBar';
import CommentsSection from '@/components/engagement/CommentsSection';

interface BlogContentProps {
  blogId: number;
}

export default function BlogContent({ blogId }: BlogContentProps) {
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);

  React.useEffect(() => {
    // Fetch initial comment count so every visitor sees current number of comments
    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/engagement/comment?blogId=${blogId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.count === 'number') setCommentCount(data.count);
      } catch (e) {
        // ignore
      }
    };

    fetchCount();
  }, [blogId]);

  const handleCommentsClick = () => {
    setShowComments(!showComments);
  };

  return (
    <>
      <EngagementBar
        blogId={blogId}
        onCommentsClick={handleCommentsClick}
        commentCount={commentCount}
      />
      
      {showComments && (
        <CommentsSection
          blogId={blogId}
          onCommentCountChange={setCommentCount}
        />
      )}
    </>
  );
}
