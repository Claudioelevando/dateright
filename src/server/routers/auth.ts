import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  loginRateLimitByEmail,
  loginRateLimitByIp,
  passwordResetRateLimitByEmail,
  passwordResetRateLimitByIp,
  signupRateLimitByIp,
} from "@/lib/rate-limit";
import { publicProcedure, router } from "../trpc";

const TOO_MANY_REQUESTS_MESSAGE = "Muitas tentativas. Tente novamente em alguns minutos.";

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase().trim();

      const [byIp, byEmail] = await Promise.all([
        loginRateLimitByIp.limit(ctx.ip),
        loginRateLimitByEmail.limit(email),
      ]);
      if (!byIp.success || !byEmail.success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: TOO_MANY_REQUESTS_MESSAGE });
      }

      const { error } = await ctx.supabase.auth.signInWithPassword({
        email,
        password: input.password,
      });
      if (error) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos." });
      }

      return { success: true as const };
    }),

  signup: publicProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase().trim();

      const { success } = await signupRateLimitByIp.limit(ctx.ip);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: TOO_MANY_REQUESTS_MESSAGE });
      }

      const { data, error } = await ctx.supabase.auth.signUp({
        email,
        password: input.password,
        options: {
          data: { name: input.name },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboarding`,
        },
      });

      if (error) {
        throw new TRPCError({
          code: error.message.toLowerCase().includes("already") ? "CONFLICT" : "BAD_REQUEST",
          message: error.message.toLowerCase().includes("already")
            ? "Este e-mail já está cadastrado."
            : error.message,
        });
      }

      return { needsEmailConfirmation: !data.session };
    }),

  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase().trim();

      const [byIp, byEmail] = await Promise.all([
        passwordResetRateLimitByIp.limit(ctx.ip),
        passwordResetRateLimitByEmail.limit(email),
      ]);
      if (!byIp.success || !byEmail.success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: TOO_MANY_REQUESTS_MESSAGE });
      }

      const { error } = await ctx.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/atualizar-senha`,
      });

      // Nunca revelamos se o e-mail existe ou não (evita enumeração de contas) — só
      // propagamos erro em falhas genuínas do serviço (ex.: Supabase fora do ar).
      if (error && error.status !== 400) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível enviar o e-mail agora. Tente novamente em instantes.",
        });
      }

      return { success: true as const };
    }),
});
