// Client-side only: fires while the app is open, no backend/push server —
// so this can't wake a closed tab, just surface a native notification
// alongside the in-app toast when permission is granted.

export function notifySupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notifyPermission(): NotificationPermission | "unsupported" {
  return notifySupported() ? Notification.permission : "unsupported";
}

export async function requestNotifyPermission(): Promise<NotificationPermission> {
  if (!notifySupported()) return "denied";
  return Notification.requestPermission();
}

export function notifyBrowser(title: string, body?: string): void {
  if (!notifySupported() || Notification.permission !== "granted") return;
  new Notification(title, { body, icon: "/icon.svg" });
}
