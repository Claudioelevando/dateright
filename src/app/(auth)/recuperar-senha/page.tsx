"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/shared/field-error";
import { FormAlert } from "@/components/shared/form-alert";
import { createClient } from "@/lib/supabase/client";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail.").email("Informe um e-mail válido."),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function RecuperarSenhaPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordValues) {
    setServerError(null);
    setSuccess(false);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/atualizar-senha`,
    });

    // Nunca revelamos se o e-mail existe ou não (evita enumeração de contas) — só
    // mostramos erro em falhas genuínas do serviço (ex.: rate limit).
    if (error && error.status !== 400) {
      setServerError("Não foi possível enviar o e-mail agora. Tente novamente em instantes.");
      return;
    }

    setSuccess(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Recuperar senha</CardTitle>
        <CardDescription>
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {serverError && <FormAlert variant="error">{serverError}</FormAlert>}
        {success && (
          <FormAlert variant="success">
            Se este e-mail existir, um link de recuperação foi enviado.
          </FormAlert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </div>

          <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Enviar link de recuperação
          </Button>
        </form>

        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-3.5" />
          Voltar para o login
        </Link>
      </CardContent>
    </Card>
  );
}
