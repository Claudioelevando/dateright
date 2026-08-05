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

/** Exemplo de perfil compatível, usado só para ilustrar a prévia de compatibilidade do questionário (M4). */
export const MOCK_MATCH_PREVIEW = {
  name: "Rafael Nogueira",
  age: 31,
  city: "Rio de Janeiro, RJ",
  bio: "Busco alguém com quem construir uma vida com propósito — família, fé e boas conversas sobre o que realmente importa.",
  photos: [placeholderPhoto("Rafael Nogueira", 3)],
  interests: ["Espiritualidade", "Natureza", "Culinária"],
};
