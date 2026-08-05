"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/shared/field-error";
import { FormAlert } from "@/components/shared/form-alert";

const signupSchema = z
  .object({
    name: z.string().min(2, "Informe seu nome completo."),
    email: z.string().min(1, "Informe seu e-mail.").email("Informe um e-mail válido."),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

type SignupValues = z.infer<typeof signupSchema>;

export default function CadastroPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupValues) {
    setServerError(null);
    setSuccess(false);

    // Dados mockados — sem integração real ainda (M2).
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (values.email === "erro@teste.com") {
      setServerError("Este e-mail já está cadastrado.");
      return;
    }

    setSuccess(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Criar conta</CardTitle>
        <CardDescription>Comece sua jornada por relacionamentos com propósito.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {serverError && <FormAlert variant="error">{serverError}</FormAlert>}
        {success && (
          <FormAlert variant="success">Cadastro simulado com sucesso (dados mockados).</FormAlert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Seu nome"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>

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

          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <FieldError message={errors.password?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            <FieldError message={errors.confirmPassword?.message} />
          </div>

          <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Criar conta
          </Button>

          <p className="text-muted-foreground text-center text-xs">
            Dica: use <code className="font-mono">erro@teste.com</code> para simular um erro.
          </p>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          Já tem conta?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
