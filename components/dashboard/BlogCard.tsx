"use client";

export default function BlogCard({ post, onEdit, onDelete }: any) {
  return (
    <div className="border p-4 rounded bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">{post.title}</h4>
          <p className="text-sm text-gray-600">{post.description}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(post)} className="text-blue-600">Edit</button>
          <button onClick={() => onDelete(post.id)} className="text-red-600">Delete</button>
        </div>
      </div>
    </div>
  );
}
