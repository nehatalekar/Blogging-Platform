const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function normalizeImageSrc(imagePath, fallback = "") {
  if (typeof imagePath !== "string") {
    return fallback;
  }

  const trimmedPath = imagePath.trim();
  if (!trimmedPath) {
    return fallback;
  }

  const repairedPath = trimmedPath
    .replace(/^\/+((?:https?:\/\/).*)$/i, "$1")
    .replace(/^https:\/(?!\/)/i, "https://")
    .replace(/^http:\/(?!\/)/i, "http://");

  if (/^https?:\/\//i.test(repairedPath) || repairedPath.startsWith("blob:")) {
    return repairedPath;
  }

  return `/${repairedPath.replace(/^\/+/, "")}`;
}

function normalizeStoredImageValue(imagePath) {
  const normalizedImagePath = normalizeImageSrc(imagePath, "");
  return normalizedImagePath || null;
}

async function updateUsers() {
  const users = await prisma.user.findMany({ select: { id: true, profileImage: true } });
  let updatedCount = 0;

  for (const user of users) {
    const nextProfileImage = normalizeStoredImageValue(user.profileImage);
    if (nextProfileImage !== (user.profileImage ?? null)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { profileImage: nextProfileImage },
      });
      updatedCount += 1;
    }
  }

  return updatedCount;
}

async function updateBlogs() {
  const blogs = await prisma.blog.findMany({
    select: { id: true, postImage: true, profileImage: true },
  });
  let updatedCount = 0;

  for (const blog of blogs) {
    const nextPostImage = normalizeStoredImageValue(blog.postImage);
    const nextProfileImage = normalizeStoredImageValue(blog.profileImage);

    if (nextPostImage !== (blog.postImage ?? null) || nextProfileImage !== (blog.profileImage ?? null)) {
      await prisma.blog.update({
        where: { id: blog.id },
        data: {
          postImage: nextPostImage,
          profileImage: nextProfileImage,
        },
      });
      updatedCount += 1;
    }
  }

  return updatedCount;
}

async function main() {
  const updatedUsers = await updateUsers();
  const updatedBlogs = await updateBlogs();
  console.log(`Updated ${updatedUsers} users and ${updatedBlogs} blogs.`);
}

main()
  .catch((error) => {
    console.error("Failed to repair image paths:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });