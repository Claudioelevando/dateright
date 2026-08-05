"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MapPin, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/shared/field-error";
import { FormAlert } from "@/components/shared/form-alert";
import { InterestPicker } from "@/components/shared/interest-picker";
import { PhotoUpload, type UploadedPhoto } from "@/components/shared/photo-upload";
import { INTEREST_OPTIONS, MOCK_PROFILE } from "@/lib/mock/profile";

const profileSchema = z
  .object({
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

type ProfileInput = z.input<typeof profileSchema>;
type ProfileOutput = z.output<typeof profileSchema>;

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photos, setPhotos] = useState<UploadedPhoto[]>(
    MOCK_PROFILE.photos.map((url) => ({ id: url, url })),
  );
  const [interests, setInterests] = useState<string[]>(MOCK_PROFILE.interests);
  const [maxDistance, setMaxDistance] = useState(MOCK_PROFILE.preferences.maxDistance);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput, unknown, ProfileOutput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: MOCK_PROFILE.bio,
      ageRangeMin: MOCK_PROFILE.preferences.ageRangeMin,
      ageRangeMax: MOCK_PROFILE.preferences.ageRangeMax,
    },
  });

  async function onSubmit() {
    setIsSaving(true);
    // Dados mockados — sem integração real ainda (M3).
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSaving(false);
    setSaved(true);
    setIsEditing(false);
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meu perfil</h1>
        {!isEditing && (
          <Button variant="outline" className="gap-1.5" onClick={() => setIsEditing(true)}>
            <Pencil className="size-4" />
            Editar perfil
          </Button>
        )}
      </div>

      {saved && (
        <FormAlert variant="success" className="mb-4">
          Perfil atualizado (dados simulados, sem integração real ainda).
        </FormAlert>
      )}

      {!isEditing ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="border-border relative aspect-square overflow-hidden rounded-xl border"
              >
                <img
                  src={photo.url}
                  alt={`Foto ${index + 1} de ${MOCK_PROFILE.name}`}
                  className="size-full object-cover"
                />
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {MOCK_PROFILE.name}, {MOCK_PROFILE.age}
              </CardTitle>
              <p className="text-muted-foreground flex items-center gap-1 text-sm">
                <MapPin className="size-3.5" />
                {MOCK_PROFILE.city}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{MOCK_PROFILE.bio}</p>
              <div className="flex flex-wrap gap-1.5">
                {interests.map((interest) => (
                  <span
                    key={interest}
                    className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
              <div className="text-muted-foreground grid grid-cols-2 gap-3 text-sm">
                <p>
                  Faixa etária: {MOCK_PROFILE.preferences.ageRangeMin}–
                  {MOCK_PROFILE.preferences.ageRangeMax} anos
                </p>
                <p>Distância máxima: {maxDistance} km</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardHeader>
              <CardTitle className="text-xl">Editar perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>Fotos</Label>
                <PhotoUpload photos={photos} onChange={setPhotos} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" rows={4} aria-invalid={!!errors.bio} {...register("bio")} />
                <FieldError message={errors.bio?.message} />
              </div>

              <div className="space-y-1.5">
                <Label>Interesses</Label>
                <InterestPicker
                  options={INTEREST_OPTIONS}
                  value={interests}
                  onChange={setInterests}
                />
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
            <CardContent className="flex justify-end gap-2 pt-0">
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-1.5">
                {isSaving && <Loader2 className="size-4 animate-spin" />}
                Salvar alterações
              </Button>
            </CardContent>
          </form>
        </Card>
      )}
    </div>
  );
}
