import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { requireOrgOwner } from "@/lib/organization";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const ownerCheck = await requireOrgOwner(auth.userId);
  if (ownerCheck instanceof NextResponse) return ownerCheck;

  const { organization } = ownerCheck;

  if (!organization.stripeCustomerId) {
    return NextResponse.json(
      { error: "Nenhuma assinatura encontrada para esta organização" },
      { status: 404 }
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: organization.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/organizacao`,
  });

  return NextResponse.json({ portalUrl: session.url });
}
