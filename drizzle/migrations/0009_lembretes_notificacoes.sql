CREATE TABLE public.notificacao_preferencias (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  modo text NOT NULL DEFAULT 'nenhuma' CHECK (modo IN ('nenhuma','diaria','personalizada')),
  canal_push boolean NOT NULL DEFAULT false,
  canal_email boolean NOT NULL DEFAULT false,
  refeicoes boolean NOT NULL DEFAULT false,
  agua boolean NOT NULL DEFAULT false,
  alertas boolean NOT NULL DEFAULT false,
  hora_diaria smallint NOT NULL DEFAULT 20 CHECK (hora_diaria BETWEEN 0 AND 23),
  horas_refeicoes jsonb NOT NULL DEFAULT '{"Café da manhã":8,"Almoço":12,"Jantar":19,"Lanches":16}'::jsonb,
  fuso text NOT NULL DEFAULT 'America/Sao_Paulo' CHECK (length(fuso) BETWEEN 1 AND 64),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notificacao_preferencias TO authenticated;
GRANT ALL ON public.notificacao_preferencias TO service_role;
ALTER TABLE public.notificacao_preferencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notif prefs select" ON public.notificacao_preferencias FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notif prefs insert" ON public.notificacao_preferencias FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notif prefs update" ON public.notificacao_preferencias FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notif prefs delete" ON public.notificacao_preferencias FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.dispositivos_push (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE CHECK (length(token) BETWEEN 20 AND 4096),
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX dispositivos_push_user_idx ON public.dispositivos_push(user_id);
GRANT SELECT, INSERT, DELETE ON public.dispositivos_push TO authenticated;
GRANT ALL ON public.dispositivos_push TO service_role;
ALTER TABLE public.dispositivos_push ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own devices select" ON public.dispositivos_push FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own devices insert" ON public.dispositivos_push FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own devices delete" ON public.dispositivos_push FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.notificacoes_enviadas (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chave text NOT NULL CHECK (length(chave) <= 120),
  enviada_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, chave)
);
GRANT ALL ON public.notificacoes_enviadas TO service_role;
ALTER TABLE public.notificacoes_enviadas ENABLE ROW LEVEL SECURITY;