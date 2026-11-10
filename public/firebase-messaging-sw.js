importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp(Object.fromEntries(new URL(self.location).searchParams));
firebase.messaging();

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const caminho = event.notification?.data?.FCM_MSG?.data?.caminho || "/hoje";
  const url = new URL(caminho.startsWith("/") ? caminho : "/hoje", self.location.origin).href;
  event.waitUntil(clients.openWindow(url));
});