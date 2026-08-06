import { adminRouter } from "./admin";
import { discoverRouter } from "./discover";
import { matchRouter } from "./match";
import { messageRouter } from "./message";
import { moderationRouter } from "./moderation";
import { premiumRouter } from "./premium";
import { profileRouter } from "./profile";
import { questionnaireRouter } from "./questionnaire";
import { router } from "../trpc";

export const appRouter = router({
  profile: profileRouter,
  questionnaire: questionnaireRouter,
  discover: discoverRouter,
  match: matchRouter,
  message: messageRouter,
  premium: premiumRouter,
  moderation: moderationRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
