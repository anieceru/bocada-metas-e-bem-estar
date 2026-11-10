const appId = import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID'] as string | undefined;
export const firebaseConfig = {
  apiKey: (import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY'] as string | undefined) ?? "",
  projectId: (import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID'] as string | undefined) ?? "",
  appId: appId ?? "",
  messagingSenderId: appId?.split(":")[1] ?? "",
};
export const vapidKey = (import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY'] as string | undefined) ?? "";

export type PushResultado = { status: "registrado"; token: string } | { status: "nao-configurado" | "sem-suporte" | "abrir-nova-aba" | "negado" };

export async function ativarPush(): Promise<PushResultado> {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId || !vapidKey || !firebaseConfig.messagingSenderId) return { status: "nao-configurado" };
  const { isSupported, getMessaging, getToken } = await import("firebase/messaging");
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !(await isSupported())) return { status: "sem-suporte" };
  if (window.top !== window.self) return { status: "abrir-nova-aba" };
  const permissao = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permissao !== "granted") return { status: "negado" };
  const { initializeApp, getApps } = await import("firebase/app");
  const registro = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${new URLSearchParams(firebaseConfig)}`);
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: registro });
  return token ? { status: "registrado", token } : { status: "negado" };
}