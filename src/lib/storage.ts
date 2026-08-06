import { createAdminClient } from "@/lib/supabase/admin";

export async function signCoverPhoto(storagePath: string | undefined) {
  if (!storagePath) return [];
  const admin = createAdminClient();
  const { data } = await admin.storage.from("profile-photos").createSignedUrl(storagePath, 3600);
  return data?.signedUrl ? [data.signedUrl] : [];
}
