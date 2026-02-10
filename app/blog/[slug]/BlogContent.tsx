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
