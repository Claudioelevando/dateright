import { placeholderPhoto } from "@/lib/mock/placeholder-photo";
import type { Profile } from "@/types/profile";

export const INTEREST_OPTIONS = [
  "Viagens",
  "Música",
  "Livros",
  "Fitness",
  "Culinária",
  "Cinema",
  "Natureza",
  "Tecnologia",
  "Arte",
  "Voluntariado",
  "Espiritualidade",
  "Jogos",
];

export const MOCK_PROFILE: Profile = {
  name: "Marina Alves",
  age: 29,
  city: "São Paulo, SP",
  bio: "Acredito que relacionamentos duradouros começam com valores em comum. Amo trilhas, café coado e boas conversas sobre o sentido da vida.",
  photos: [
    placeholderPhoto("Marina Alves", 0),
    placeholderPhoto("Marina Alves", 1),
    placeholderPhoto("Marina Alves", 2),
  ],
  interests: ["Viagens", "Livros", "Natureza", "Espiritualidade"],
  preferences: { ageRangeMin: 27, ageRangeMax: 38, maxDistance: 25 },
};
