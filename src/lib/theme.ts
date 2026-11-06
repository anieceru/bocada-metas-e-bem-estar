export type Tema = "claro" | "escuro" | "sistema";
const KEY = "bocada-tema";

export function lerTema(): Tema {
  if (typeof window === "undefined") return "sistema";
  const t = localStorage.getItem(KEY);
  return t === "claro" || t === "escuro" ? t : "sistema";
}

export function aplicarTema(t: Tema) {
  localStorage.setItem(KEY, t);
  const escuro =
    t === "escuro" || (t === "sistema" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", escuro);
}

export const scriptTemaInicial = `(function(){try{var t=localStorage.getItem('${KEY}');var d=t==='escuro'||(t!=='claro'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(e){var c=localStorage.getItem('${KEY}');if(c!=='claro'&&c!=='escuro')document.documentElement.classList.toggle('dark',e.matches)})}catch(e){}})();`;
