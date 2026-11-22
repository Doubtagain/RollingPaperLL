-- ============================================================
-- 멋사 수원대 크리스마스 롤링페이퍼 — 스키마 / RLS / RPC 초안
-- 프론트(src/features/*/api.ts)가 가정하는 인터페이스와 1:1 대응.
-- 실제 적용 전 백엔드 담당자가 검토할 것.
-- ============================================================

create extension if not exists pgcrypto;

-- ── tables ──────────────────────────────────────────────────
create table public.members (
  id          uuid primary key default gen_random_uuid(),
  auth_id     uuid unique references auth.users(id) on delete set null,
  name        text not null,
  part        text not null check (part in ('plan','design','frontend','backend')),
  generation  int  not null,
  role        text not null default 'member' check (role in ('member','admin')),
  avatar_url  text,
  invite_code text not null unique
);

create table public.boards (
  id        uuid primary key default gen_random_uuid(),
  owner_id  uuid references public.members(id) on delete cascade,
  is_group  boolean not null default false,
  title     text,
  open_at   timestamptz not null default '2026-11-30 19:00:00+09',
  constraint board_owner_or_group check (is_group or owner_id is not null)
);
create unique index boards_owner_unique on public.boards(owner_id) where not is_group;

-- ── helpers (security definer: RLS 정책 안에서 재귀 없이 사용) ─────────
create or replace function public.current_member_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from members where auth_id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where auth_id = auth.uid() and role = 'admin')
$$;

create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references public.boards(id) on delete cascade,
  author_id   uuid not null default public.current_member_id() references public.members(id) on delete cascade,
  nickname    text not null check (char_length(nickname) between 1 and 12),
  content     text not null check (char_length(content) between 1 and 500),
  card_design text not null check (card_design in ('kraft','red-check','snow','green-pine')),
  stickers    jsonb not null default '[]'::jsonb
              check (jsonb_typeof(stickers) = 'array' and jsonb_array_length(stickers) <= 6),
  is_hidden   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (board_id, author_id)
);

-- 멤버 생성 시 개인 보드 자동 생성
create or replace function public.on_member_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into boards(owner_id, open_at)
  values (new.id, coalesce((select max(open_at) from boards), '2026-11-30 19:00:00+09'));
  return new;
end $$;
create trigger trg_member_created after insert on public.members
  for each row execute function public.on_member_created();

-- updated_at / author_id 위조 방지
create or replace function public.on_message_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.author_id := current_member_id();
    new.is_hidden := false;
  else
    new.author_id := old.author_id;
    new.board_id  := old.board_id;
    if not is_admin() then new.is_hidden := old.is_hidden; end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger trg_message_write before insert or update on public.messages
  for each row execute function public.on_message_write();

-- ── RLS ─────────────────────────────────────────────────────
alter table public.members  enable row level security;
alter table public.boards   enable row level security;
alter table public.messages enable row level security;

-- members: 원본 테이블은 admin 만 (일반 사용자는 member_directory view 사용)
create policy members_admin_all on public.members
  for all using (public.is_admin()) with check (public.is_admin());

-- boards: 로그인 사용자 조회 가능, 수정은 admin
create policy boards_select on public.boards for select to authenticated using (true);
create policy boards_admin on public.boards for all using (public.is_admin()) with check (public.is_admin());

-- messages SELECT: 작성자 본인 OR (보드 주인 AND 공개됨) OR admin
create policy messages_select on public.messages for select to authenticated using (
  author_id = public.current_member_id()
  or public.is_admin()
  or exists (
    select 1 from public.boards b
    where b.id = board_id and b.owner_id = public.current_member_id() and now() >= b.open_at
  )
);

-- INSERT: 작성자 본인, 공개 전, 자기 보드 아님
create policy messages_insert on public.messages for insert to authenticated with check (
  author_id = public.current_member_id()
  and exists (
    select 1 from public.boards b
    where b.id = board_id and now() < b.open_at
      and b.owner_id is distinct from public.current_member_id()
  )
);

-- UPDATE / DELETE: 작성자 본인, 공개 전
create policy messages_update on public.messages for update to authenticated
  using (
    author_id = public.current_member_id()
    and exists (select 1 from public.boards b where b.id = board_id and now() < b.open_at)
  )
  with check (author_id = public.current_member_id());

create policy messages_delete on public.messages for delete to authenticated using (
  author_id = public.current_member_id()
  and exists (select 1 from public.boards b where b.id = board_id and now() < b.open_at)
);

-- ── views (security_invoker → 호출자 RLS 적용) ───────────────
create view public.member_directory with (security_invoker = false) as
  select m.id, m.name, m.part, m.generation, m.role, m.avatar_url, b.id as board_id
  from public.members m
  join public.boards b on b.owner_id = m.id and not b.is_group
  where auth.uid() is not null;   -- 로그인 사용자만. auth_id / invite_code 비노출
grant select on public.member_directory to authenticated;

create view public.public_messages with (security_invoker = true) as
  select id, board_id, nickname, content, card_design, stickers, created_at, updated_at,
         (author_id = public.current_member_id()) as is_mine
  from public.messages
  where not is_hidden;            -- author_id 제외. 공개 조건은 messages RLS 가 강제
grant select on public.public_messages to authenticated;

-- ── RPC ─────────────────────────────────────────────────────
create or replace function public.get_my_member()
returns setof public.member_directory
language sql stable security definer set search_path = public as $$
  select m.id, m.name, m.part, m.generation, m.role, m.avatar_url, b.id
  from members m join boards b on b.owner_id = m.id and not b.is_group
  where m.auth_id = auth.uid()
$$;

create or replace function public.link_member(invite_code text)
returns setof public.member_directory
language plpgsql security definer set search_path = public as $$
declare target members;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into target from members m where m.invite_code = upper(trim(link_member.invite_code));
  if target.id is null then raise exception 'INVALID_INVITE'; end if;
  if target.auth_id is not null and target.auth_id <> auth.uid() then
    raise exception 'ALREADY_LINKED';
  end if;
  update members set auth_id = auth.uid() where id = target.id;
  return query select * from get_my_member();
end $$;

-- 공개 전에도 개수만 조회 가능 (내용은 절대 반환하지 않음)
create or replace function public.get_board_summary(board_id uuid)
returns table (board_id uuid, count bigint, opened boolean, open_at timestamptz)
language sql stable security definer set search_path = public as $$
  select b.id, (select count(*) from messages m where m.board_id = b.id and not m.is_hidden),
         now() >= b.open_at, b.open_at
  from boards b where b.id = get_board_summary.board_id and auth.uid() is not null
$$;

create or replace function public.get_board_summaries()
returns table (board_id uuid, count bigint, opened boolean, open_at timestamptz)
language sql stable security definer set search_path = public as $$
  select b.id, count(m.id) filter (where not m.is_hidden), now() >= b.open_at, b.open_at
  from boards b left join messages m on m.board_id = b.id
  where auth.uid() is not null
  group by b.id
$$;

create or replace function public.get_my_written_member_ids()
returns uuid[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(distinct b.owner_id) filter (where b.owner_id is not null), '{}')
  from messages m join boards b on b.id = m.board_id
  where m.author_id = current_member_id()
$$;

create or replace function public.get_admin_stats()
returns table (member_id uuid, name text, part text, generation int,
               received_count bigint, written_count bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'insufficient_privilege' using errcode = '42501'; end if;
  return query
    select mb.id, mb.name, mb.part, mb.generation,
      (select count(*) from messages m join boards b on b.id = m.board_id
         where b.owner_id = mb.id and not m.is_hidden),
      (select count(*) from messages m where m.author_id = mb.id)
    from members mb;
end $$;

create or replace function public.admin_list_messages()
returns table (id uuid, board_id uuid, nickname text, content text, card_design text,
               stickers jsonb, created_at timestamptz, updated_at timestamptz,
               author_id uuid, author_name text, owner_name text, is_hidden boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'insufficient_privilege' using errcode = '42501'; end if;
  return query
    select m.id, m.board_id, m.nickname, m.content, m.card_design, m.stickers,
           m.created_at, m.updated_at, m.author_id, a.name, o.name, m.is_hidden
    from messages m
    join members a on a.id = m.author_id
    join boards b on b.id = m.board_id
    left join members o on o.id = b.owner_id
    order by m.created_at desc;
end $$;

create or replace function public.admin_set_message_hidden(message_id uuid, hidden boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'insufficient_privilege' using errcode = '42501'; end if;
  update messages set is_hidden = hidden where id = message_id;
end $$;

create or replace function public.admin_set_open_at(open_at timestamptz)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'insufficient_privilege' using errcode = '42501'; end if;
  update boards set open_at = admin_set_open_at.open_at;
end $$;

revoke execute on all functions in schema public from anon;
