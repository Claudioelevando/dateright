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

    // Dados mockados — sem integração real ainda (M2).
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (values.email === "erro@teste.com") {
      setServerError("Não encontramos uma conta com este e-mail.");
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
            Se este e-mail existir, um link de recuperação foi enviado (simulado).
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

          <p className="text-muted-foreground text-center text-xs">
            Dica: use <code className="font-mono">erro@teste.com</code> para simular um erro.
          </p>
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
