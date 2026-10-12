-- Tabla de activos. Pegar en Supabase > SQL Editor > Run.

create table if not exists public.activos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ticker        text not null,
  tipo          text not null check (tipo in ('accion', 'cedear', 'bono', 'fci', 'cripto', 'efectivo', 'otro')),
  cantidad      numeric not null check (cantidad >= 0),
  moneda        text not null check (moneda in ('ARS', 'USD', 'USDT', 'EUR', 'otra')),
  precio_compra numeric check (precio_compra >= 0),
  fecha_compra  date,
  broker        text,
  notas         text,
  creado_en     timestamptz not null default now()
);

create index if not exists activos_user_id_idx on public.activos (user_id);

-- Seguridad: cada usuario solo ve y modifica sus propias filas.
alter table public.activos enable row level security;

drop policy if exists "activos_select_propios" on public.activos;
drop policy if exists "activos_insert_propios" on public.activos;
drop policy if exists "activos_update_propios" on public.activos;
drop policy if exists "activos_delete_propios" on public.activos;

create policy "activos_select_propios" on public.activos
  for select to authenticated using (user_id = auth.uid());

create policy "activos_insert_propios" on public.activos
  for insert to authenticated with check (user_id = auth.uid());

create policy "activos_update_propios" on public.activos
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "activos_delete_propios" on public.activos
  for delete to authenticated using (user_id = auth.uid());
