"use client";

import { useEffect, useState } from "react";
import RichTextEditor from "./RichTextEditor";
import { BlogCreateInput, BlogData, BlogUpdateInput } from "@/types/blog";

function normalizeImagePath(imagePath: string) {
  return imagePath.startsWith("http") ? imagePath : `/${imagePath.replace(/^\/+/, "")}`;
}

export default function BlogModal({
  open,
  onClose,
  onSaveDraft,
  onPublish,
  onDelete,
  onUpdate,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaveDraft: (data: BlogCreateInput) => Promise<void>;
  onPublish: (data: BlogCreateInput) => Promise<void>;
  onDelete: (id?: number) => Promise<void>;
  onUpdate: (data: BlogUpdateInput) => Promise<void>;
  initial?: BlogData;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoadingMode, setAiLoadingMode] = useState<string | null>(null);

  useEffect(() => {
    if (open && initial) {
      setTitle(initial.title || "");
      setDescription(initial.description || "");
      setTag(initial.tag || "");
      setImagePreview(initial.postImage ? normalizeImagePath(initial.postImage) : null);
      setContent(initial.content || "");
    }
    if (!open) {
      setTitle("");
      setDescription("");
      setTag("");
      setImageFile(null);
      setImagePreview(null);
      setContent("");
      setAiOpen(false);
      setAiTopic("");
    }
  }, [open, initial]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setImageFile(f);
    if (f) setImagePreview(URL.createObjectURL(f));
  };

  const hasEditorContent = () => {
    const txt = content.replace(/<[^>]*>/g, "").trim();
    return txt.length > 0;
  };

  const callAI = async (mode: string) => {
    setAiLoadingMode(mode);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, prompt: aiTopic, title, description, content }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.content) setContent(data.content);
      if (data.tag) setTag(data.tag);
    } finally {
      setAiLoadingMode(null);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return undefined;

    const arrayBuffer = await imageFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = typeof window !== "undefined" ? window.btoa(binary) : Buffer.from(bytes).toString("base64");

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: imageFile.name, data: base64 }),
    });
    const json = await res.json();
    return json.path as string | undefined;
  };

  const buildUpdatePayload = async (nextStatus: "draft" | "published") => {
    if (!initial?.id) {
      return null;
    }

    const payload: BlogUpdateInput = { id: initial.id };
    const nextTitle = title.trim();
    const currentTitle = initial.title?.trim() || "";
    const currentDescription = initial.description || "";
    const nextTag = (tag || "General").trim() || "General";
    const currentTag = (initial.tag || "General").trim() || "General";
    const currentContent = initial.content || "";
    const currentStatus = initial.status || "published";

    if (nextTitle !== currentTitle) {
      payload.title = nextTitle;
    }

    if (description !== currentDescription) {
      payload.description = description;
    }

    if (nextTag !== currentTag) {
      payload.tag = nextTag;
    }

    if (content !== currentContent) {
      payload.content = content;
    }

    const imagePath = await uploadImage();
    if (imagePath !== undefined) {
      payload.postImage = imagePath;
    }

    if (nextStatus !== currentStatus) {
      payload.status = nextStatus;
    }

    return payload;
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      if (initial?.id) {
        const payload = await buildUpdatePayload("draft");
        if (payload && Object.keys(payload).length > 1) {
          await onUpdate(payload);
        }
      } else {
        const imagePath = await uploadImage();
        await onSaveDraft({
          title: title.trim(),
          description,
          tag: (tag || "General").trim() || "General",
          postImage: imagePath,
          content,
          slug: initial?.slug,
        });
      }

      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      if (initial?.id) {
        const payload = await buildUpdatePayload("published");
        if (payload && Object.keys(payload).length > 1) {
          await onUpdate(payload);
        }
      } else {
        const imagePath = await uploadImage();
        await onPublish({
          title: title.trim(),
          description,
          tag: (tag || "General").trim() || "General",
          postImage: imagePath,
          content,
          status: "published",
        });
      }

      onClose();
    } finally {
      setIsSaving(false);
    }
  };


  const handleDelete = async () => {
    if (!initial?.id) return;
    await onDelete(initial.id);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-[960px] max-w-4xl bg-white rounded-xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold">{initial ? "Edit Blog" : "Create Blog"}</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAiOpen((v) => !v)}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                aiOpen
                  ? "bg-violet-100 text-violet-700"
                  : "bg-gray-100 text-gray-700 hover:bg-violet-50 hover:text-violet-600"
              }`}
            >
              ✨ AI Draft
            </button>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800">Close</button>
          </div>
        </div>

        {aiOpen && (
          <div className="mb-6 p-4 bg-violet-50 border border-violet-200 rounded-lg">
            <p className="text-sm font-medium text-violet-800 mb-2">Describe your blog topic</p>
            <textarea
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="e.g. The future of AI in healthcare"
              className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white resize-none"
              rows={2}
              disabled={aiLoadingMode === "draft"}
            />
            <button
              onClick={() => callAI("draft")}
              disabled={aiLoadingMode === "draft" || !aiTopic.trim()}
              className="mt-2 px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 transition"
            >
              {aiLoadingMode === "draft" ? "Generating..." : "Generate Draft"}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">Title</label>
              <button
                type="button"
                onClick={() => callAI("regenerate-title")}
                disabled={aiLoadingMode === "regenerate-title" || !title}
                title="Regenerate title with AI"
                className="text-xs text-violet-600 hover:text-violet-800 disabled:opacity-40 transition"
              >
                {aiLoadingMode === "regenerate-title" ? "..." : "↻ Regenerate"}
              </button>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full placeholder:text-[0.85rem] mt-2 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="Enter a short, descriptive title"
              maxLength={120}
            />
            <div className="text-xs text-gray-400 mt-2">{title.length}/120</div>

            <div className="flex items-center justify-between mt-4">
              <label className="block text-sm font-medium">Description</label>
              <button
                type="button"
                onClick={() => callAI("regenerate-description")}
                disabled={aiLoadingMode === "regenerate-description" || !title}
                title="Regenerate description with AI"
                className="text-xs text-violet-600 hover:text-violet-800 disabled:opacity-40 transition"
              >
                {aiLoadingMode === "regenerate-description" ? "..." : "↻ Regenerate"}
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-2 px-4 py-3 placeholder:text-[0.85rem] border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="Short summary used on lists and previews"
              rows={4}
            />

            <label className="block text-sm font-medium mt-4">Tag</label>
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. Technology, Business"
              className="w-full placeholder:text-[0.85rem] mt-2 px-4 py-3 border rounded-lg"
            />

            <label className="block text-sm font-medium mt-4">Feature Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full mt-2 text-sm" />
            {imagePreview ? <img src={imagePreview} alt="preview" className="mt-3 w-full max-h-48 object-cover rounded-lg" /> : null}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">Content</label>
              <button
                type="button"
                onClick={() => callAI("improve-content")}
                disabled={aiLoadingMode === "improve-content" || !hasEditorContent()}
                className="text-xs px-2.5 py-1 bg-violet-100 text-violet-700 rounded hover:bg-violet-200 disabled:opacity-40 transition"
              >
                {aiLoadingMode === "improve-content" ? "..." : "✨ Improve"}
              </button>
            </div>
            <div className="mt-2  rounded-lg min-h-[320px] p-2">
              <RichTextEditor key={initial?.id || 'new'} initialContent={content} onChange={setContent} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            {initial?.id && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition"
                disabled={isSaving}
              >
                Delete
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {(!initial?.id || initial?.status === "draft") && (
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm hover:bg-gray-200 transition"
                disabled={isSaving}
              >
                {initial?.id ? "Update Draft" : "Save Draft"}
              </button>
            )}

            <button
              onClick={handlePublish}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-60"
              disabled={isSaving || !hasEditorContent()}
            >
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
