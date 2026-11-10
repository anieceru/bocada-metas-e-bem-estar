const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";

/** Envia uma notificação sem dados de saúde. Retorna false se o token expirou. */
export async function enviarPush(token: string, titulo: string, corpo: string, caminho: string) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connKey = process.env["FIREBASE_MESSAGING_API_KEY"];
  if (!lovableKey || !connKey) throw new Error("Serviço de notificações não configurado");
  const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connKey, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { token, notification: { title: titulo, body: corpo }, data: { caminho } } }),
  });
  if (res.ok) return true;
  const texto = await res.text();
  if (res.status === 404 || (res.status === 400 && /UNREGISTERED|INVALID_ARGUMENT/.test(texto))) return false;
  throw new Error(`Falha ao enviar notificação [${res.status}]: ${texto.slice(0, 300)}`);
}