"use client";

import { useEffect, useState } from "react";
import RichTextEditor from "./RichTextEditor";

type BlogData = {
  id?: number;
  title?: string;
  description?: string;
  postImage?: string;
  slug?: string;
  content?: string;
  status?: string;
  tag?: string;
  author?: string;
};

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
  onSaveDraft: (data: BlogData) => Promise<void>;
  onPublish: (data: BlogData) => Promise<void>;
  onDelete: (id?: number) => Promise<void>;
  onUpdate: (data: BlogData) => Promise<void>;
  initial?: BlogData;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && initial) {
      setTitle(initial.title || "");
      setDescription(initial.description || "");
      setTag(initial.tag || "");
      setImagePreview(initial.postImage ? `/${initial.postImage}` : null);
      setContent(initial.content || "");
    }
    if (!open) {
      setTitle("");
      setDescription("");
      setTag("");
      setImageFile(null);
      setImagePreview(null);
      setContent("");
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

  const handleSaveDraft = async () => {
    setIsSaving(true);
    const imagePath = await uploadImage();
    if (initial?.id) {
      // Update existing draft
      await onUpdate({
        id: initial.id,
        title,
        description,
        tag: tag || "General",
        postImage: imagePath,
        content,
        status: initial?.status,
      });
    } else {
      // Create new draft
      await onSaveDraft({
        title,
        description,
        tag: tag || "General",
        postImage: imagePath,
        content,
        slug: initial?.slug,
      });
    }
    setIsSaving(false);
    onClose();
  };

  const handlePublish = async () => {
    setIsSaving(true);
    const imagePath = await uploadImage();
    await onPublish({
      id: initial?.id,
      title,
      description,
      tag: tag || "General",
      postImage: imagePath,
      content,
      status: "published",
    });
    setIsSaving(false);
    onClose();
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    const imagePath = await uploadImage();
    await onUpdate({
      id: initial?.id,
      title,
      description,
      tag: tag || "General",
      postImage: imagePath,
      content,
      status: initial?.status,
    });
    setIsSaving(false);
    onClose();
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
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">Close</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full placeholder:text-[0.85rem] mt-2 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="Enter a short, descriptive title"
              maxLength={120}
            />
            <div className="text-xs text-gray-400 mt-2">{title.length}/120</div>

            <label className="block text-sm font-medium mt-4">Description</label>
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
            <label className="block text-sm font-medium">Content</label>
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
