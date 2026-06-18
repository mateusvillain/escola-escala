import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponseHeaders } from "@/lib/csv";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  instructor: "Instrutor",
  student: "Aluno",
};

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = request.nextUrl;
  const role = searchParams.get("role") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const where = {
    ...(role ? { role: role as "admin" | "instructor" | "student" } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const users = await prisma.user.findMany({
    where,
    select: {
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = users.map(u => [
    u.name,
    u.email,
    ROLE_LABELS[u.role] ?? u.role,
    u.isActive ? "Ativo" : "Inativo",
    u.createdAt.toISOString(),
  ]);

  const csv = toCsv(["Nome", "E-mail", "Role", "Status", "Data de cadastro"], rows);

  return new NextResponse(csv, {
    status: 200,
    headers: csvResponseHeaders("usuarios.csv"),
  });
}
