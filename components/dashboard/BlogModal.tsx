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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && initial) {
      setTitle(initial.title || "");
      setDescription(initial.description || "");
      setImagePreview(initial.postImage ? `/${initial.postImage}` : null);
      setContent(initial.content || "");
    }
    if (!open) {
      setTitle("");
      setDescription("");
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
    await onSaveDraft({
      title,
      description,
      postImage: imagePath,
      content,
      slug: initial?.slug,
    });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[900px] max-w-full bg-white rounded shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{initial ? "Edit Blog" : "Create Blog"}</h3>
          <button onClick={onClose} className="text-gray-500">Close</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mt-1 p-2 border rounded" />

            <label className="block text-sm font-medium mt-3">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full mt-1 p-2 border rounded" />

            <label className="block text-sm font-medium mt-3">Feature Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full mt-1" />
            {imagePreview ? <img src={imagePreview} alt="preview" className="mt-2 w-full max-h-44 object-cover rounded" /> : null}
          </div>

          <div>
            <label className="block text-sm font-medium">Content</label>
            <RichTextEditor initialContent={content} onChange={setContent} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 bg-gray-100 rounded"
            disabled={isSaving}
          >
            Save Draft
          </button>

          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-yellow-100 rounded"
            disabled={isSaving || !initial?.id}
          >
            Edit
          </button>

          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-100 rounded"
            disabled={isSaving || !initial?.id}
          >
            Delete
          </button>

          <button
            onClick={handlePublish}
            className="px-4 py-2 bg-green-500 text-white rounded"
            disabled={isSaving || !hasEditorContent()}
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
