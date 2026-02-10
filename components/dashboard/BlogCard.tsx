"use client";

export default function BlogCard({ post, onEdit, onDelete }: any) {
  return (
    <div className="border p-4 rounded-md bg-white shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-lg text-gray-900">{post.title}</h4>

          {post?.status === "draft" ? (
            <span className="text-xs px-2 py-1 bg-yellow-50 text-yellow-800 rounded-full">Draft</span>
          ) : (
            <span className="text-xs px-2 py-1 bg-green-50 text-green-800 rounded-full">Published</span>
          )}
        </div>

        <p className="text-sm text-gray-600 mt-2 max-h-14  overflow-hidden">{post.description}</p>

        {post.updatedAt && (
          <div className="mt-3 text-xs text-gray-500">{new Date(post.updatedAt).toLocaleDateString()}</div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          onClick={() => onEdit(post)}
          className=" w-20 px-3 py-1.5 bg-gray-100  text-gray-800 rounded-sm text-sm hover:bg-gray-200 transition"
        >
          Edit
        </button>

        <button
          onClick={() => onDelete(post.id)}
          className="w-20 px-3 py-1.5 bg-red-50  text-red-600 rounded-sm text-sm hover:bg-red-100 transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
