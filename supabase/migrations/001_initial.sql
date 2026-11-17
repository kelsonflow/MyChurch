-- Apply to a new Supabase project. All timestamps are stored in UTC.
begin;
create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 email text not null, role text not null check(role in ('admin','editor')) default 'editor',
 status text not null check(status in ('active','suspended')) default 'active',
 created_at timestamptz not null default now()
);
-- Live membership + live session check: suspension, revocation and sign-out take effect
-- immediately, including for still-valid access tokens used directly against PostgREST.
create function public.is_staff() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p join auth.sessions s on s.user_id=p.id
 where p.id=auth.uid() and p.status='active' and s.id::text=auth.jwt()->>'session_id');
$$;
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select public.is_staff() and exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
create table public.content (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in ('page','event','video','ministry','album')),
 slug text not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), title text not null check(length(title) between 2 and 160),
 status text not null default 'draft' check(status in ('draft','published','archived')),
 data jsonb not null default '{}' check(jsonb_typeof(data)='object' and octet_length(data::text)<200000),
 starts_at timestamptz, ends_at timestamptz,
 updated_at timestamptz not null default now(), updated_by uuid references auth.users(id) on delete set null,
 unique(kind,slug), check(kind<>'event' or (starts_at is not null and ends_at is not null and ends_at>=starts_at))
);
create index content_public on public.content(kind,status,starts_at);
create table public.revisions (
 id bigint generated always as identity primary key, content_id uuid not null references public.content(id) on delete cascade,
 snapshot jsonb not null, author uuid, created_at timestamptz not null default now()
);
create table public.settings(id int primary key check(id=1),data jsonb not null default '{}');
insert into public.settings values(1,'{"name":"Assembleia de Deus — Missão aos Povos","confirmed":false}');
create table public.audit_log(id bigint generated always as identity primary key,actor uuid,action text not null,entity_id text,created_at timestamptz not null default now());
create table public.media(id uuid primary key default gen_random_uuid(), alt text not null check(length(alt) between 1 and 300),caption text not null default '',focal_x int not null default 50 check(focal_x between 0 and 100),focal_y int not null default 50 check(focal_y between 0 and 100),created_at timestamptz not null default now());
create table public.messages(id uuid primary key default gen_random_uuid(),name text not null,email text not null,subject text not null,message text not null,created_at timestamptz not null default now());
create table private.rate_limits(key text primary key,hits int not null default 1,window_start timestamptz not null default now());

create function private.guard_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(871336);
 if TG_OP in ('UPDATE','DELETE') and old.role='admin' and old.status='active' then
  if TG_OP='DELETE' or new.role<>'admin' or new.status<>'active' then
   if (select count(*) from public.profiles where role='admin' and status='active')<=1 then raise exception 'O último administrador ativo não pode ser removido ou suspenso.';end if;
  end if;
 end if;
 if TG_OP='DELETE' then
  delete from auth.sessions where user_id=old.id;
  insert into public.audit_log(actor,action,entity_id) values(auth.uid(),'access_revoked',old.id::text);
  return old;
 end if;
 if TG_OP='UPDATE' and (new.status<>old.status or new.role<>old.role) then
  delete from auth.sessions where user_id=new.id;
 end if;
 insert into public.audit_log(actor,action,entity_id) values(auth.uid(),'access_'||lower(TG_OP),new.id::text);
 return new;
end;$$;
create trigger profile_guard before insert or update or delete on public.profiles for each row execute function private.guard_profile();

create function private.content_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='UPDATE' then insert into public.revisions(content_id,snapshot,author) values(old.id,to_jsonb(old),old.updated_by);end if;
 new.updated_at=clock_timestamp();new.updated_by=auth.uid();
 if new.kind='event' then
  new.starts_at=(new.data->>'start')::timestamp at time zone 'Europe/Lisbon';
  new.ends_at=(new.data->>'end')::timestamp at time zone 'Europe/Lisbon';
  if coalesce(new.data->>'eventState','') not in ('scheduled','cancelled','postponed') then raise exception 'Estado de evento inválido';end if;
 end if;
 if new.kind='video' and (coalesce(new.data->>'youtube','') !~ '^https://(www\.|m\.)?youtube\.com/(watch\?v=|embed/|shorts/)[A-Za-z0-9_-]{11}([?&].*)?$' and coalesce(new.data->>'youtube','') !~ '^https://youtu\.be/[A-Za-z0-9_-]{11}([?].*)?$') then raise exception 'URL YouTube inválido';end if;
 insert into public.audit_log(actor,action,entity_id) values(auth.uid(),'content_'||lower(TG_OP),new.id::text);
 return new;
end;$$;
create trigger content_change before insert or update on public.content for each row execute function private.content_change();

create function private.settings_change() returns trigger language plpgsql security definer set search_path='' as $$begin insert into public.audit_log(actor,action,entity_id) values(auth.uid(),'settings_update','1');return new;end;$$;
create trigger settings_change before update on public.settings for each row execute function private.settings_change();
create function public.restore_revision(revision_id bigint) returns uuid language plpgsql security definer set search_path='' as $$
declare r public.revisions;result uuid;
begin
 if not public.is_staff() then raise exception 'Sem permissão';end if;
 select * into strict r from public.revisions where id=revision_id;
 -- Restore as draft so an old version cannot inadvertently republish.
 update public.content set title=r.snapshot->>'title',slug=r.snapshot->>'slug',data=r.snapshot->'data',status='draft',starts_at=(r.snapshot->>'starts_at')::timestamptz,ends_at=(r.snapshot->>'ends_at')::timestamptz where id=r.content_id returning id into result;
 return result;
end;$$;
create function public.media_is_public(media_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.content where status='published' and data::text like '%'||media_id::text||'%')
 or exists(select 1 from public.settings where data->>'logo'=media_id::text);
$$;
create function private.guard_media_delete() returns trigger language plpgsql security definer set search_path='' as $$
begin if exists(select 1 from public.content where data::text like '%'||old.id::text||'%') or exists(select 1 from public.settings where data->>'logo'=old.id::text) then raise exception 'Esta imagem está em utilização. Remova as referências antes de eliminar.';end if;return old;end;$$;
create trigger media_delete before delete on public.media for each row execute function private.guard_media_delete();

create function public.submit_message(p_name text,p_email text,p_subject text,p_message text,p_key text) returns void language plpgsql security definer set search_path='' as $$
declare n int;
begin
 if length(p_name) not between 2 and 100 or length(p_email)>200 or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(p_subject) not between 3 and 160 or length(p_message) not between 10 and 5000 then raise exception 'Dados inválidos';end if;
 delete from private.rate_limits where window_start<now()-interval '2 hours';
 insert into private.rate_limits(key,hits) values(p_key,1) on conflict(key) do update set hits=case when private.rate_limits.window_start<now()-interval '1 hour' then 1 else private.rate_limits.hits+1 end,window_start=case when private.rate_limits.window_start<now()-interval '1 hour' then now() else private.rate_limits.window_start end returning hits into n;
 if n>4 then raise exception 'Limite de mensagens atingido. Tente mais tarde.';end if;
 insert into public.messages(name,email,subject,message) values(p_name,p_email,p_subject,p_message);
end;$$;
revoke all on function public.submit_message(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.submit_message(text,text,text,text,text) to service_role;
revoke all on function public.restore_revision(bigint) from public,anon;
grant execute on function public.restore_revision(bigint) to authenticated;

alter table public.profiles enable row level security;
alter table public.content enable row level security;
alter table public.revisions enable row level security;
alter table public.settings enable row level security;
alter table public.audit_log enable row level security;
alter table public.media enable row level security;
alter table public.messages enable row level security;
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy profile_insert on public.profiles for insert to authenticated with check(public.is_admin());
create policy profile_update on public.profiles for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy profile_delete on public.profiles for delete to authenticated using(public.is_admin());
create policy content_read on public.content for select to anon,authenticated using(status='published' or public.is_staff());
create policy content_insert on public.content for insert to authenticated with check(public.is_staff());
create policy content_update on public.content for update to authenticated using(public.is_staff()) with check(public.is_staff());
-- Editorial records are archived, never deleted through the application.
create policy revisions_read on public.revisions for select to authenticated using(public.is_staff());
create policy settings_read on public.settings for select to anon,authenticated using(true);
create policy settings_update on public.settings for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy audit_read on public.audit_log for select to authenticated using(public.is_admin());
create policy media_read on public.media for select to anon,authenticated using(public.is_staff() or public.media_is_public(id));
create policy media_insert on public.media for insert to authenticated with check(public.is_staff());
create policy media_update on public.media for update to authenticated using(public.is_staff()) with check(public.is_staff());
create policy media_delete on public.media for delete to authenticated using(public.is_staff());
create policy message_read on public.messages for select to authenticated using(public.is_staff());
create policy message_delete on public.messages for delete to authenticated using(public.is_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('media','media',false,10485760,array['image/webp']);
create policy storage_read on storage.objects for select to anon,authenticated using(bucket_id='media' and (public.is_staff() or exists(select 1 from public.media m where name like m.id::text||'/%' and public.media_is_public(m.id))));
-- No client write policy: only validated server uploads may write bytes.
-- Explicit privileges complement RLS. No client can create users in auth.users.
grant select on public.content,public.settings,public.media to anon;
grant select,insert,update on public.content to authenticated;
grant select,insert,update,delete on public.profiles,public.media to authenticated;
grant select,update on public.settings to authenticated;
grant select on public.revisions,public.audit_log to authenticated;
grant select,delete on public.messages to authenticated;
commit;
