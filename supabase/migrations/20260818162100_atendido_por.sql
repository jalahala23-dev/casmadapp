alter table public.cotizaciones
  add column if not exists atendido_por_id uuid,
  add column if not exists atendido_por_nombre text,
  add column if not exists atendido_por_telefono text;

alter table public.facturas
  add column if not exists atendido_por_id uuid,
  add column if not exists atendido_por_nombre text,
  add column if not exists atendido_por_telefono text;


create or replace function public.casmad_asignar_atendido_cotizacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid;
  v_nombre text;
  v_telefono text;
begin
  v_usuario_id := auth.uid();

  if new.atendido_por_id is null then
    new.atendido_por_id := v_usuario_id;
  end if;

  if new.atendido_por_id is not null then
    select nombre, telefono
    into v_nombre, v_telefono
    from public.perfiles
    where id = new.atendido_por_id;

    if new.atendido_por_nombre is null then
      new.atendido_por_nombre := v_nombre;
    end if;

    if new.atendido_por_telefono is null then
      new.atendido_por_telefono := v_telefono;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_casmad_atendido_cotizacion
on public.cotizaciones;

create trigger trg_casmad_atendido_cotizacion
before insert on public.cotizaciones
for each row
execute function public.casmad_asignar_atendido_cotizacion();


create or replace function public.casmad_asignar_atendido_factura()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid;
  v_nombre text;
  v_telefono text;
begin
  if new.cotizacion_id is not null then
    select
      atendido_por_id,
      atendido_por_nombre,
      atendido_por_telefono
    into
      new.atendido_por_id,
      new.atendido_por_nombre,
      new.atendido_por_telefono
    from public.cotizaciones
    where id = new.cotizacion_id;
  end if;

  if new.atendido_por_id is null then
    v_usuario_id := auth.uid();
    new.atendido_por_id := v_usuario_id;
  end if;

  if new.atendido_por_id is not null
     and (
       new.atendido_por_nombre is null
       or new.atendido_por_telefono is null
     )
  then
    select nombre, telefono
    into v_nombre, v_telefono
    from public.perfiles
    where id = new.atendido_por_id;

    if new.atendido_por_nombre is null then
      new.atendido_por_nombre := v_nombre;
    end if;

    if new.atendido_por_telefono is null then
      new.atendido_por_telefono := v_telefono;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_casmad_atendido_factura
on public.facturas;

create trigger trg_casmad_atendido_factura
before insert on public.facturas
for each row
execute function public.casmad_asignar_atendido_factura();
