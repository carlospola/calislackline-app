-- db/policies.sql
-- Snapshot delle RLS policy modificate il 2026-06-02
-- (hardening privilege escalation su profiles).
-- NB: la fonte di verita' resta il SQL editor di Supabase; qui documentiamo
--     SOLO le modifiche di sicurezza applicate in questa data.

-- profiles_insert
-- PRIMA: with check ( auth.uid() = id )
-- DOPO:  vincola anche role/status -> niente auto-admin in registrazione.
alter policy "profiles_insert"
on "public"."profiles"
to public
with check (
  auth.uid() = id
  and role = 'athlete'
  and status = 'pending'
);

-- profiles_update
-- PRIMA: with check ( (auth.uid() = id) OR is_admin() )
-- DOPO:  vincola anche role -> un atleta loggato non puo' promuoversi admin
--        modificando la propria riga (USING invariato).
alter policy "profiles_update"
on "public"."profiles"
to public
using (
  (auth.uid() = id) or is_admin()
)
with check (
  ((auth.uid() = id) and role = 'athlete') or is_admin()
);

-- TODO (pre-SaaS): bloccare anche la modifica di profiles.status dal browser
--   (oggi un atleta puo' ancora cambiarsi lo status). Fix previsto: trigger
--   BEFORE UPDATE che forza role/status ai valori OLD se il chiamante non e' service_role.
--
-- Snapshot completo di tutte le policy attuali (quando serve, esegui e incolla qui):
--   select policyname, cmd, qual, with_check
--   from pg_policies where schemaname = 'public';
