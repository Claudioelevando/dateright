import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

async function setPremiumByCustomerId(customerId: string, data: { isPremium: boolean; stripeSubscriptionId?: string }) {
  const result = await prisma.profile.updateMany({
    where: { stripeCustomerId: customerId },
    data,
  });
  if (result.count === 0) {
    console.error(`Webhook Stripe: nenhum profile encontrado para stripeCustomerId=${customerId}`);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook Stripe: assinatura inválida.", err);
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && typeof session.customer === "string") {
        await setPremiumByCustomerId(session.customer, {
          isPremium: true,
          stripeSubscriptionId:
            typeof session.subscription === "string" ? session.subscription : undefined,
        });
      }
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      if (typeof subscription.customer === "string") {
        await setPremiumByCustomerId(subscription.customer, {
          isPremium: ["active", "trialing"].includes(subscription.status),
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      if (typeof subscription.customer === "string") {
        await setPremiumByCustomerId(subscription.customer, { isPremium: false });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
