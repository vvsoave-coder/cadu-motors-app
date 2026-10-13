-- Corrige recursão infinita na policy de SELECT de public.profiles.
--
-- A policy "profiles: admin vê todos os perfis" consultava a própria
-- tabela profiles dentro da checagem de RLS (para saber se quem está
-- logado é admin), o que o Postgres não permite sem recursão infinita.
-- Isso quebrava TODA leitura de profiles com erro 500, inclusive o
-- próprio usuário lendo seu próprio perfil (checkUserAuth no login).
--
-- Como o app não tem uma tela de "listar todos os usuários", a policy
-- de self-select sozinha já cobre o uso real (checar o próprio role).
-- Removendo a policy recursiva.

do $$
declare
  r record;
begin
  for r in select policyname from pg_policies where tablename = 'profiles' and cmd = 'SELECT'
  loop
    execute format('drop policy %I on public.profiles', r.policyname);
  end loop;
end $$;

create policy "profiles_self_select" on public.profiles for select using (auth.uid() = id);
