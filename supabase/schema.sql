-- Tabla de activos (versión sin login, solo para uso local).
-- Pegar en Supabase > SQL Editor > Run. Se puede correr más de una vez sin problema.

create table if not exists public.activos (
  id            uuid primary key default gen_random_uuid(),
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

alter table public.activos enable row level security;

-- Limpia las políticas de la versión con login.
drop policy if exists "activos_select_propios" on public.activos;
drop policy if exists "activos_insert_propios" on public.activos;
drop policy if exists "activos_update_propios" on public.activos;
drop policy if exists "activos_delete_propios" on public.activos;
drop policy if exists "activos_abierto_temporal" on public.activos;

-- La columna user_id ya no se usa sin login.
drop index if exists public.activos_user_id_idx;
alter table public.activos drop column if exists user_id;

-- ATENCIÓN: política abierta TEMPORAL. Con ella, cualquiera que tenga la URL y la
-- publishable key puede leer y escribir la tabla. Es aceptable mientras la app
-- corre solo en local. Antes de publicarla hay que cerrarla (acceso con passkey).
create policy "activos_abierto_temporal" on public.activos
  for all to anon, authenticated using (true) with check (true);
