"use client";

import { useEffect, useRef } from "react";
import "quill/dist/quill.snow.css";

type Props = {
  initialContent?: string;
  onChange?: (html: string) => void;
};

export default function RichTextEditor({ initialContent = "", onChange }: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<any | null>(null);

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
      quillRef.current.root.innerHTML = initialContent || '';

      // limit editor content height and enable internal scrolling
      try {
        quillRef.current.root.style.maxHeight = '200px';
        quillRef.current.root.style.overflowY = 'auto';
      } catch (e) {
        // ignore
      }

      quillRef.current.on('text-change', () => {
        onChange?.(quillRef.current.root.innerHTML);
      });
    })();

    return () => { mounted = false; if (quillRef.current) { quillRef.current = null; } };
  }, []);

  useEffect(() => {
    if (quillRef.current) {
      const current = quillRef.current;
      if ((current.root && current.root.innerHTML) !== initialContent) {
        current.root.innerHTML = initialContent || '';
      }
    }
  }, [initialContent]);

  return (
    <div className="bg-white border border-gray-200 rounded">
      <div ref={editorRef} className="min-h-[200px] " />
    </div>
  );
}
