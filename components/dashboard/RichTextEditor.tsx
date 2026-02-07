"use client";

import { useEffect, useRef, useCallback } from "react";
import "quill/dist/quill.snow.css";

type Props = {
  initialContent?: string;
  onChange?: (html: string) => void;
};

export default function RichTextEditor({ initialContent = "", onChange }: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<any | null>(null);
  const isInitializingRef = useRef(true);
  const lastContentRef = useRef<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!editorRef.current) return;
      const Quill = (await import('quill')).default;

      if (!mounted) return;

      const modules = {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean'],
        ],
      };

      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules,
      });

      // set initial content
      if (initialContent) {
        quillRef.current.root.innerHTML = initialContent;
        lastContentRef.current = initialContent;
      }
      isInitializingRef.current = false;

      // limit editor content height and enable internal scrolling
      try {
        quillRef.current.root.style.maxHeight = '200px';
        quillRef.current.root.style.overflowY = 'auto';
      } catch (e) {
        // ignore
      }

      quillRef.current.on('text-change', () => {
        const newContent = quillRef.current.root.innerHTML;
        lastContentRef.current = newContent;
        onChange?.(newContent);
      });
    })();

    return () => { 
      mounted = false; 
      if (quillRef.current) { 
        quillRef.current = null;
      } 
    };
  }, []);

  // Only update content when initialContent changes from external sources (not from user typing)
  useEffect(() => {
    if (quillRef.current && !isInitializingRef.current && initialContent && initialContent !== lastContentRef.current) {
      quillRef.current.root.innerHTML = initialContent;
      lastContentRef.current = initialContent;
      const length = quillRef.current.getLength();
      quillRef.current.setSelection(length);
    }
  }, [initialContent]);

  return (
    <div className="bg-white border border-gray-200 rounded">
      <div ref={editorRef} className="min-h-[200px] " />
    </div>
  );
}
