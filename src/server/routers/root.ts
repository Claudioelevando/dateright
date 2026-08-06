import { discoverRouter } from "./discover";
import { matchRouter } from "./match";
import { profileRouter } from "./profile";
import { questionnaireRouter } from "./questionnaire";
import { router } from "../trpc";

export const appRouter = router({
  profile: profileRouter,
  questionnaire: questionnaireRouter,
  discover: discoverRouter,
  match: matchRouter,
});

export type AppRouter = typeof appRouter;
