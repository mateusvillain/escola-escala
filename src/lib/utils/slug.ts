import { PrismaClient } from "@/generated/prisma/client";

export function generateSlug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getUniqueSlug(title: string, prisma: PrismaClient): Promise<string> {
  const base = generateSlug(title);
  const existing = await prisma.course.findUnique({ where: { slug: base } });
  if (!existing) return base;

  let counter = 2;
  while (true) {
    const candidate = `${base}-${counter}`;
    const conflict = await prisma.course.findUnique({ where: { slug: candidate } });
    if (!conflict) return candidate;
    counter++;
  }
}
