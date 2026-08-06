"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/shared/field-error";
import { FormAlert } from "@/components/shared/form-alert";
import { InterestPicker } from "@/components/shared/interest-picker";
import { PhotoUpload, type UploadedPhoto } from "@/components/shared/photo-upload";
import { ProfileCard } from "@/components/shared/profile-card";
import { StepIndicator } from "@/components/shared/step-indicator";
import { createClient } from "@/lib/supabase/client";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

function calculateAge(birthDate: string) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

function extensionForMime(mime: string) {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  return "jpg";
}

const GENDER_OPTIONS = [
  { value: "MASCULINO", label: "Masculino" },
  { value: "FEMININO", label: "Feminino" },
] as const;

const INTERESTED_IN_OPTIONS = [
  { value: "MASCULINO", label: "Homens" },
  { value: "FEMININO", label: "Mulheres" },
  { value: "AMBOS", label: "Ambos" },
] as const;

const onboardingSchema = z
  .object({
    name: z.string().min(2, "Informe seu nome completo."),
    birthDate: z
      .string()
      .min(1, "Informe sua data de nascimento.")
      .refine((value) => calculateAge(value) >= 18, "Você precisa ter pelo menos 18 anos."),
    city: z.string().min(2, "Informe sua cidade."),
    gender: z.enum(["MASCULINO", "FEMININO"], { error: "Selecione uma opção." }),
    interestedIn: z.enum(["MASCULINO", "FEMININO", "AMBOS"], { error: "Selecione uma opção." }),
    bio: z
      .string()
      .min(20, "Escreva pelo menos 20 caracteres.")
      .max(500, "Máximo de 500 caracteres."),
    ageRangeMin: z.coerce.number().min(18).max(99),
    ageRangeMax: z.coerce.number().min(18).max(99),
  })
  .refine((data) => data.ageRangeMax >= data.ageRangeMin, {
    message: "A idade máxima deve ser maior ou igual à mínima.",
    path: ["ageRangeMax"],
  });

type OnboardingInput = z.input<typeof onboardingSchema>;
type OnboardingOutput = z.output<typeof onboardingSchema>;

const STEPS = ["Informações", "Fotos", "Bio e preferências", "Revisão"];

export default function OnboardingPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: availableInterests } = trpc.profile.listInterests.useQuery();
  const completeOnboarding = trpc.profile.completeOnboarding.useMutation();
  const addPhoto = trpc.profile.addPhoto.useMutation();

  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [interestsError, setInterestsError] = useState<string | null>(null);
  const [maxDistance, setMaxDistance] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<OnboardingInput, unknown, OnboardingOutput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { ageRangeMin: 21, ageRangeMax: 40 },
  });

  const values = watch();
  const interestLabelToSlug = new Map(
    (availableInterests ?? []).map((interest) => [interest.label, interest.slug]),
  );

  async function goNext() {
    if (step === 0) {
      const valid = await trigger(["name", "birthDate", "city", "gender", "interestedIn"]);
      if (!valid) return;
    }

    if (step === 1) {
      if (photos.length === 0) {
        setPhotosError("Adicione pelo menos 1 foto.");
        return;
      }
      setPhotosError(null);
    }

    if (step === 2) {
      const valid = await trigger(["bio", "ageRangeMin", "ageRangeMax"]);
      if (interests.length < 3) {
        setInterestsError("Selecione pelo menos 3 interesses.");
        return;
      }
      setInterestsError(null);
      if (!valid) return;
    }

    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0));
  }

  async function onSubmit(data: OnboardingOutput) {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSubmitError("Sessão expirada. Faça login novamente.");
        router.push("/login");
        return;
      }

      const interestSlugs = interests
        .map((label) => interestLabelToSlug.get(label))
        .filter((slug): slug is string => !!slug);

      await completeOnboarding.mutateAsync({
        name: data.name,
        birthDate: new Date(data.birthDate),
        city: data.city,
        gender: data.gender,
        interestedIn: data.interestedIn,
        bio: data.bio,
        interestSlugs,
        ageRangeMin: data.ageRangeMin,
        ageRangeMax: data.ageRangeMax,
        maxDistanceKm: maxDistance,
      });

      for (const photo of photos) {
        if (!photo.file) continue;
        const path = `${user.id}/${photo.id}.${extensionForMime(photo.file.type)}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(path, photo.file, { contentType: photo.file.type, upsert: true });

        if (uploadError) throw uploadError;

        await addPhoto.mutateAsync({ storagePath: path });
      }

      await utils.profile.me.invalidate();
      setIsComplete(true);
    } catch {
      setSubmitError("Não foi possível salvar seu perfil. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="bg-primary/10 flex size-14 items-center justify-center rounded-full">
          <Check className="text-primary size-7" />
        </div>
        <h1 className="text-2xl font-semibold">Perfil criado!</h1>
        <p className="text-muted-foreground text-sm">
          Seu perfil foi salvo. A próxima etapa é o questionário de valores.
        </p>
        <Button size="lg" className="h-11 w-full" onClick={() => router.push("/questionnaire")}>
          Ir para o questionário
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="h-11 w-full"
          onClick={() => router.push("/profile")}
        >
          Ver meu perfil
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
      <StepIndicator steps={STEPS} currentStep={step} className="mb-8" />

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {step === 0 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl">Sobre você</CardTitle>
                <CardDescription>Vamos começar com o básico.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    autoComplete="name"
                    aria-invalid={!!errors.name}
                    {...register("name")}
                  />
                  <FieldError message={errors.name?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="birthDate">Data de nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    aria-invalid={!!errors.birthDate}
                    {...register("birthDate")}
                  />
                  <FieldError message={errors.birthDate?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="Sua cidade"
                    autoComplete="address-level2"
                    aria-invalid={!!errors.city}
                    {...register("city")}
                  />
                  <FieldError message={errors.city?.message} />
                </div>

                <div className="space-y-1.5">
                  <Label>Gênero</Label>
                  <div role="radiogroup" aria-label="Gênero" className="flex gap-2">
                    {GENDER_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={cn(
                          "has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-foreground",
                          "border-border text-muted-foreground flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                        )}
                      >
                        <input
                          type="radio"
                          value={option.value}
                          className="sr-only"
                          {...register("gender")}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                  <FieldError message={errors.gender?.message} />
                </div>

                <div className="space-y-1.5">
                  <Label>Interessado(a) em</Label>
                  <div role="radiogroup" aria-label="Interessado(a) em" className="flex gap-2">
                    {INTERESTED_IN_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={cn(
                          "has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-foreground",
                          "border-border text-muted-foreground flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                        )}
                      >
                        <input
                          type="radio"
                          value={option.value}
                          className="sr-only"
                          {...register("interestedIn")}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                  <FieldError message={errors.interestedIn?.message} />
                </div>
              </CardContent>
            </>
          )}

          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl">Suas fotos</CardTitle>
                <CardDescription>
                  Adicione pelo menos 1 foto. A primeira será sua capa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <PhotoUpload photos={photos} onChange={setPhotos} />
                <FieldError message={photosError ?? undefined} />
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl">Bio e preferências</CardTitle>
                <CardDescription>Conte um pouco sobre você e o que procura.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={4}
                    placeholder="Fale sobre seus valores, o que você busca..."
                    aria-invalid={!!errors.bio}
                    {...register("bio")}
                  />
                  <FieldError message={errors.bio?.message} />
                </div>

                <div className="space-y-1.5">
                  <Label>Interesses</Label>
                  <InterestPicker
                    options={(availableInterests ?? []).map((interest) => interest.label)}
                    value={interests}
                    onChange={setInterests}
                  />
                  <FieldError message={interestsError ?? undefined} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ageRangeMin">Idade mínima</Label>
                    <Input
                      id="ageRangeMin"
                      type="number"
                      min={18}
                      max={99}
                      {...register("ageRangeMin")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ageRangeMax">Idade máxima</Label>
                    <Input
                      id="ageRangeMax"
                      type="number"
                      min={18}
                      max={99}
                      {...register("ageRangeMax")}
                    />
                    <FieldError message={errors.ageRangeMax?.message} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maxDistance">Distância máxima</Label>
                    <span className="text-muted-foreground text-sm">{maxDistance} km</span>
                  </div>
                  <input
                    id="maxDistance"
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={maxDistance}
                    onChange={(event) => setMaxDistance(Number(event.target.value))}
                    className="accent-primary w-full"
                  />
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl">Revisão</CardTitle>
                <CardDescription>Confira como seu perfil vai aparecer.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {submitError && <FormAlert variant="error">{submitError}</FormAlert>}
                <ProfileCard
                  className="mx-auto max-w-xs"
                  profile={{
                    name: values.name,
                    age: values.birthDate ? calculateAge(values.birthDate) : 0,
                    city: values.city,
                    bio: values.bio,
                    photos: photos.map((photo) => photo.url),
                    interests,
                  }}
                />
              </CardContent>
            </>
          )}

          <CardContent className="flex items-center justify-between pt-0">
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              disabled={step === 0}
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Voltar
            </Button>

            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={goNext} className="gap-1.5">
                Continuar
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="gap-1.5">
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Concluir
              </Button>
            )}
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
