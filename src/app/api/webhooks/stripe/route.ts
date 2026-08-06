import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

async function setPremiumByCustomerId(
  customerId: string,
  data: { isPremium: boolean; stripeSubscriptionId?: string },
) {
  const result = await prisma.profile.updateMany({
    where: { stripeCustomerId: customerId },
    data,
  });
  return result.count > 0;
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
        const data = {
          isPremium: true,
          stripeSubscriptionId:
            typeof session.subscription === "string" ? session.subscription : undefined,
        };
        const found = await setPremiumByCustomerId(session.customer, data);
        // Fallback de defesa em profundidade: stripeCustomerId normalmente já foi persistido por
        // createCheckoutSession antes do checkout completar, mas se essa escrita falhou por algum
        // motivo, client_reference_id (o profileId) permite recuperar e já grava o customerId certo.
        if (!found && session.client_reference_id) {
          await prisma.profile.updateMany({
            where: { id: session.client_reference_id },
            data: { ...data, stripeCustomerId: session.customer },
          });
        } else if (!found) {
          console.error(`Webhook Stripe: nenhum profile encontrado para stripeCustomerId=${session.customer}`);
        }
      }
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      if (typeof subscription.customer === "string") {
        const found = await setPremiumByCustomerId(subscription.customer, {
          isPremium: ["active", "trialing"].includes(subscription.status),
        });
        if (!found) {
          console.error(`Webhook Stripe: nenhum profile encontrado para stripeCustomerId=${subscription.customer}`);
        }
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      if (typeof subscription.customer === "string") {
        const found = await setPremiumByCustomerId(subscription.customer, { isPremium: false });
        if (!found) {
          console.error(`Webhook Stripe: nenhum profile encontrado para stripeCustomerId=${subscription.customer}`);
        }
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
