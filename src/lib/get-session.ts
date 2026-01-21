import { headers } from "next/headers";
import { auth } from "./auth";
import { cache } from "react";
import { checkAndUpdateExpiredBatchesThrottled } from "./batch-expiry-utils";

export const getServerSession = cache(async () => {
  // Trigger throttled expiration check globally on every session check (ubiquitous)
  checkAndUpdateExpiredBatchesThrottled().catch(e => console.error("Session trigger fail:", e));

  return await auth.api.getSession({ headers: await headers() });
})