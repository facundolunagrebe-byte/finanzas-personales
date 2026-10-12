-- Tabla de activos con login. Pegar en Supabase > SQL Editor > Run.
-- Se puede correr más de una vez sin problema.

create table if not exists public.activos (
  id            uuid primary key default gen_random_uuid(),
  ticker        text not null,
  tipo          text not null check (tipo in ('accion', 'cedear', 'bono', 'fci', 'cripto', 'efectivo', 'otro')),
  cantidad      numeric not null check (cantidad >= 0),
  moneda        text not null check (moneda in ('ARS', 'USD', 'USDT', 'EUR', 'otra')),
  precio_compra numeric check (precio_compra >= 0),
  comision      numeric not null default 0 check (comision >= 0),
  fecha_compra  date,
  broker        text,
  notas         text,
  creado_en     timestamptz not null default now()
);

alter table public.activos add column if not exists comision numeric not null default 0 check (comision >= 0);

-- Dueño de cada fila. Se agrega sin "not null" para poder asignar las filas existentes.
alter table public.activos
  add column if not exists user_id uuid default auth.uid() references auth.users (id) on delete cascade;

-- Las filas cargadas antes del login pasan a ser del único usuario confirmado.
-- Si hay más de un usuario confirmado, frena en vez de adivinar.
do $$
declare
  uid uuid;
  n   int;
begin
  if exists (select 1 from public.activos where user_id is null) then
    select count(*) into n from auth.users where email_confirmed_at is not null;
    if n <> 1 then
      raise exception 'Se esperaba 1 usuario confirmado y hay %', n;
    end if;
    select id into uid from auth.users where email_confirmed_at is not null;
    update public.activos set user_id = uid where user_id is null;
  end if;
end $$;

alter table public.activos alter column user_id set not null;
create index if not exists activos_user_id_idx on public.activos (user_id);

-- Seguridad: cada usuario solo ve y modifica sus propias filas. Sin login no se accede a nada.
alter table public.activos enable row level security;

drop policy if exists "activos_abierto_temporal" on public.activos;
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
