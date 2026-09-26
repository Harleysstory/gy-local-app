import webpush from "web-push";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

let configured = false;

export function pushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
  );
}

function ensureConfig() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:harley@bradfordindependent.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configured = true;
}

/** Send one notification. Throws on failure — caller decides cleanup. */
export async function sendPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload
): Promise<void> {
  ensureConfig();
  await webpush.sendNotification(subscription as never, JSON.stringify(payload), {
    TTL: 60 * 60 * 12, // don't deliver stale briefs
  });
}
