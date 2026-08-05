import { MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProfileCardData {
  name: string;
  age: number;
  city?: string;
  bio?: string;
  photos: string[];
  interests?: string[];
  compatibility?: number;
}

interface ProfileCardProps {
  profile: ProfileCardData;
  className?: string;
}

export function ProfileCard({ profile, className }: ProfileCardProps) {
  const { name, age, city, bio, photos, interests, compatibility } = profile;
  const coverPhoto = photos[0];

  return (
    <div
      className={cn(
        "relative flex aspect-[3/4] w-full flex-col overflow-hidden rounded-2xl",
        className,
      )}
    >
      {coverPhoto ? (
        <img
          src={coverPhoto}
          alt={`Foto de ${name}`}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="bg-muted absolute inset-0" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {typeof compatibility === "number" && (
        <Badge className="absolute top-3 right-3">{compatibility}% compatível</Badge>
      )}

      <div className="relative mt-auto space-y-2 p-4 text-white">
        <h3 className="text-xl font-semibold">
          {name || "Seu nome"}
          {age > 0 && `, ${age}`}
        </h3>
        {city && (
          <p className="flex items-center gap-1 text-sm text-white/80">
            <MapPin className="size-3.5" />
            {city}
          </p>
        )}
        {bio && <p className="line-clamp-2 text-sm text-white/90">{bio}</p>}
        {interests && interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {interests.slice(0, 4).map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-white/15 px-2 py-0.5 text-xs backdrop-blur-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
