import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const role = request.nextUrl.searchParams.get("role");

  if (role === "instructor") {
    const instructors = await prisma.instructor.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { user: { name: "asc" } },
    });
    return NextResponse.json({ users: instructors });
  }

  return NextResponse.json(
    { error: "Parâmetro 'role' inválido ou ausente" },
    { status: 400 }
  );
}
