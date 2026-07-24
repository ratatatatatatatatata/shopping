"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Writes an admin activity log row. Errors are swallowed on purpose —
 * logging must never break the actual mutation.
 */
export async function logAdminAction(
  action: string,
  entity: string,
  entityId?: string,
  detail?: object
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("admin_activity_logs").insert({
      admin_id: user.id,
      action,
      entity,
      entity_id: entityId ?? null,
      detail: detail ?? {},
    });
  } catch {
    // swallow — logging is best-effort
  }
}
