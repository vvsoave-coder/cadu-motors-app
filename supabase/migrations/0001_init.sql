-- Cadu Motors — schema inicial no Supabase
-- Roda isso uma vez no SQL Editor do Supabase (ou via `supabase db push`).

-- =========================================================
-- 1. Extensão para gerar UUID
-- =========================================================
create extension if not exists "pgcrypto";

-- =========================================================
-- 2. Lista de e-mails admin (equivalente a base44/shared/adminEmails.js)
--    Edite aqui pra adicionar/remover administradores.
-- =========================================================
create table if not exists public.admin_emails (
  email text primary key
);

insert into public.admin_emails (email) values
  ('motorscadu@gmail.com'),
  ('vvsoave@gmail.com')
on conflict (email) do nothing;

-- =========================================================
-- 3. profiles — 1 linha por usuário autenticado, com o "role".
--    Criada automaticamente no primeiro login via trigger.
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    case when exists (select 1 from public.admin_emails ae where lower(ae.email) = lower(new.email))
         then 'admin' else 'user' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Se o e-mail for adicionado à lista de admins DEPOIS que a pessoa já tinha
-- logado uma vez, rode manualmente:
--   update public.profiles set role = 'admin' where email = 'novo@email.com';

alter table public.profiles enable row level security;

create policy "profiles: usuário vê o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: admin vê todos os perfis"
  on public.profiles for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- =========================================================
-- 4. vehicles — equivalente a base44/entities/Vehicle.jsonc
-- =========================================================
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instagram_caption text,
  description text,
  price numeric,
  photos text[] default '{}',
  photo_url text,
  gallery text[] default '{}',
  brand text,
  model text,
  year integer,
  km integer,
  transmission text,
  fuel text,
  color text,
  category text not null default 'portfolio' check (category in ('blindado', 'portfolio', 'vendido')),
  is_blindado boolean not null default false,
  is_vendido boolean not null default false,
  override_manual boolean not null default false,
  review_status text not null default 'publicado' check (review_status in ('pendente', 'publicado')),
  instagram_url text,
  instagram_post_id text unique,
  instagram_media_id text,
  ad_link text,
  data_publicacao date,
  data_venda date,
  ativo boolean not null default true,
  is_sample boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create index if not exists vehicles_category_idx on public.vehicles (category);
create index if not exists vehicles_ativo_idx on public.vehicles (ativo);
create index if not exists vehicles_instagram_post_id_idx on public.vehicles (instagram_post_id);

create or replace function public.set_updated_date()
returns trigger language plpgsql as $$
begin
  new.updated_date = now();
  return new;
end;
$$;

drop trigger if exists vehicles_set_updated_date on public.vehicles;
create trigger vehicles_set_updated_date
  before update on public.vehicles
  for each row execute function public.set_updated_date();

alter table public.vehicles enable row level security;
alter publication supabase_realtime add table public.vehicles;

-- Leitura pública (o site mostra os veículos pra qualquer visitante)
create policy "vehicles: leitura pública"
  on public.vehicles for select
  using (true);

-- Escrita só pra admin (mesma regra do Base44: rls.create/update/delete = role admin)
create policy "vehicles: admin cria"
  on public.vehicles for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "vehicles: admin atualiza"
  on public.vehicles for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "vehicles: admin exclui"
  on public.vehicles for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- =========================================================
-- 5. instagram_connection — guarda o token da conta conectada
--    (equivalente ao conector gerenciado pelo Base44). Só o backend
--    (service role) lê/escreve aqui — nunca o navegador.
-- =========================================================
create table if not exists public.instagram_connection (
  id int primary key default 1 check (id = 1), -- singleton: 1 linha só
  ig_user_id text,
  username text,
  access_token text,
  token_expires_at timestamptz,
  connected_at timestamptz,
  connected_by uuid references auth.users (id),
  last_synced_at timestamptz
);

alter table public.instagram_connection enable row level security;
-- Nenhuma policy = ninguém acessa via client (anon/authenticated).
-- Só a service_role key (usada nas funções serverless) consegue ler/escrever.

-- =========================================================
-- 6. Bucket de Storage pra fotos dos veículos (permanente, substitui o
--    hotlink direto pro CDN do Instagram, que expira).
--    Isso aqui roda no SQL Editor também, ou crie o bucket pela UI
--    (Storage → New bucket → "vehicle-photos" → público).
-- =========================================================
insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', true)
on conflict (id) do nothing;

create policy "vehicle-photos: leitura pública"
  on storage.objects for select
  using (bucket_id = 'vehicle-photos');

create policy "vehicle-photos: service role ou admin escreve"
  on storage.objects for insert
  with check (
    bucket_id = 'vehicle-photos'
    and (
      auth.role() = 'service_role' -- o sync automático do Instagram
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') -- upload manual no Admin
    )
  );

create policy "vehicle-photos: admin pode apagar/substituir"
  on storage.objects for delete
  using (
    bucket_id = 'vehicle-photos'
    and (
      auth.role() = 'service_role'
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    )
  );

-- =========================================================
-- 7. oauth_state — nonce de uso único pra fechar o fluxo OAuth do
--    Instagram com segurança (o callback é chamado pelo Instagram, não
--    pelo nosso fetch autenticado, então não carrega o JWT do Supabase).
-- =========================================================
create table if not exists public.oauth_state (
  state text primary key,
  user_id uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.oauth_state enable row level security;
-- Sem policy = só a service role (backend) acessa.
