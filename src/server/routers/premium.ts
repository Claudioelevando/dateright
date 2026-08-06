import { TRPCError } from "@trpc/server";

import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

import { participantInclude, toMatchParticipant } from "./match";
import { protectedProcedure, router } from "../trpc";

async function getOrCreateStripeCustomerId(profile: { id: string; email: string; stripeCustomerId: string | null }) {
  if (profile.stripeCustomerId) return profile.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: profile.email,
    metadata: { profileId: profile.id },
  });

  await prisma.profile.update({
    where: { id: profile.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export const premiumRouter = router({
  createCheckoutSession: protectedProcedure.mutation(async ({ ctx }) => {
    const me = await prisma.profile.findUnique({ where: { id: ctx.userId } });
    if (!me) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Complete seu perfil primeiro." });
    }
    if (me.isPremium) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Você já é Premium." });
    }

    const customerId = await getOrCreateStripeCustomerId(me);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID!, quantity: 1 }],
      success_url: `${appUrl}/premium?checkout=success`,
      cancel_url: `${appUrl}/premium?checkout=cancelled`,
      client_reference_id: ctx.userId,
    });

    if (!session.url) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível iniciar o checkout." });
    }

    return { url: session.url };
  }),

  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const me = await prisma.profile.findUnique({ where: { id: ctx.userId } });
    if (!me?.stripeCustomerId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Você ainda não tem uma assinatura." });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: me.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/premium`,
    });

    return { url: session.url };
  }),

  getLikers: protectedProcedure.query(async ({ ctx }) => {
    const me = await prisma.profile.findUnique({ where: { id: ctx.userId } });
    if (!me) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Complete seu perfil primeiro." });
    }

    const swiped = await prisma.swipe.findMany({
      where: { swiperId: ctx.userId },
      select: { swipedId: true },
    });
    const excludeIds = [ctx.userId, ...swiped.map((s) => s.swipedId)];

    const likeSwipes = await prisma.swipe.findMany({
      where: { swipedId: ctx.userId, action: "LIKE", swiperId: { notIn: excludeIds } },
      orderBy: { createdAt: "desc" },
      include: { swiper: { include: participantInclude } },
    });

    if (!me.isPremium) {
      return { count: likeSwipes.length, likers: [] };
    }

    return {
      count: likeSwipes.length,
      likers: await Promise.all(likeSwipes.map((s) => toMatchParticipant(s.swiper))),
    };
  }),
});
