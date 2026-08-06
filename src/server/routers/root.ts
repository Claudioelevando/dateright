import { profileRouter } from "./profile";
import { questionnaireRouter } from "./questionnaire";
import { router } from "../trpc";

export const appRouter = router({
  profile: profileRouter,
  questionnaire: questionnaireRouter,
});

export type AppRouter = typeof appRouter;
