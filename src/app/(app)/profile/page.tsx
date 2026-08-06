"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { createClient } from "@/lib/supabase/client";
import { trpc } from "@/lib/trpc/client";

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

function calculateAge(birthDate: string | Date) {
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

export default function ProfilePage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.profile.me.useQuery();
  const { data: availableInterests } = trpc.profile.listInterests.useQuery();
  const updatePreferences = trpc.profile.updatePreferences.useMutation();
  const addPhoto = trpc.profile.addPhoto.useMutation();
  const removePhoto = trpc.profile.removePhoto.useMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [initialPhotoIds, setInitialPhotoIds] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState(25);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileInput, unknown, ProfileOutput>({ resolver: zodResolver(profileSchema) });

  const interestLabelToSlug = new Map(
    (availableInterests ?? []).map((interest) => [interest.label, interest.slug]),
  );

  // Sincroniza o estado editável local quando o perfil carrega/muda — feito durante a
  // renderização (não em um efeito) seguindo o padrão de "ajustar estado quando uma prop
  // muda" do React, já que interests/maxDistance viram estado próprio editável pelo usuário.
  const [syncedProfileId, setSyncedProfileId] = useState<string | null>(null);
  if (profile && profile.id !== syncedProfileId) {
    setSyncedProfileId(profile.id);
    reset({
      bio: profile.bio ?? "",
      ageRangeMin: profile.ageRangeMin,
      ageRangeMax: profile.ageRangeMax,
    });
    setInterests(profile.interests.map((pi) => pi.interest.label));
    setMaxDistance(profile.maxDistanceKm);
  }

  useEffect(() => {
    if (!profile) return;

    const supabase = createClient();
    Promise.all(
      profile.photos.map(async (photo) => {
        const { data } = await supabase.storage
          .from("profile-photos")
          .createSignedUrl(photo.storagePath, 3600);
        return { id: photo.id, url: data?.signedUrl ?? "", storagePath: photo.storagePath };
      }),
    ).then((signed) => {
      setPhotos(signed);
      setInitialPhotoIds(signed.map((p) => p.id));
    });
  }, [profile]);

  useEffect(() => {
    if (!isLoading && profile === null) router.replace("/onboarding");
  }, [isLoading, profile, router]);

  async function onSubmit(data: ProfileOutput) {
    if (!profile) return;
    setSaveError(null);
    setIsSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("no session");

      const removedIds = initialPhotoIds.filter((id) => !photos.some((p) => p.id === id));
      for (const photoId of removedIds) {
        const result = await removePhoto.mutateAsync({ photoId });
        await supabase.storage.from("profile-photos").remove([result.storagePath]);
      }

      for (const photo of photos) {
        if (!photo.file) continue;
        const path = `${user.id}/${photo.id}.${extensionForMime(photo.file.type)}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(path, photo.file, { contentType: photo.file.type, upsert: true });
        if (uploadError) throw uploadError;
        await addPhoto.mutateAsync({ storagePath: path });
      }

      const interestSlugs = interests
        .map((label) => interestLabelToSlug.get(label))
        .filter((slug): slug is string => !!slug);

      await updatePreferences.mutateAsync({
        bio: data.bio,
        interestSlugs,
        ageRangeMin: data.ageRangeMin,
        ageRangeMax: data.ageRangeMax,
        maxDistanceKm: maxDistance,
      });

      await utils.profile.me.invalidate();
      setSaved(true);
      setIsEditing(false);
    } catch {
      setSaveError("Não foi possível salvar as alterações. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || !profile) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
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
          Perfil atualizado.
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`Foto ${index + 1} de ${profile.name}`}
                  className="size-full object-cover"
                />
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {profile.name}, {calculateAge(profile.birthDate)}
              </CardTitle>
              <p className="text-muted-foreground flex items-center gap-1 text-sm">
                <MapPin className="size-3.5" />
                {profile.city}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{profile.bio}</p>
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
                  Faixa etária: {profile.ageRangeMin}–{profile.ageRangeMax} anos
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
              {saveError && <FormAlert variant="error">{saveError}</FormAlert>}

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
                  options={(availableInterests ?? []).map((interest) => interest.label)}
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
