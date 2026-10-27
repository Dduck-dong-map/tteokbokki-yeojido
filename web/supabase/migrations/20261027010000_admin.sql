-- 떡볶여지도 운영 어드민 DB 설계 (기획: docs/어드민기획_v1_2026-10-27.md). 아직 적용 안 함.
-- 20261027000000_init.sql 다음에 적용한다.
--
-- 원칙
-- * 운영하는 사람(staff)만 어드민 표를 읽고 쓴다. 역할: owner(관리자) · moderator(운영자) · crew(크루).
-- * 모든 변경은 audit_logs 에 남고, audit_logs 는 아무도 고치거나 지울 수 없다.
-- * 가게는 지우지 않는다. 숨김(hidden)·폐업(closed)과 되살리기만 있다.
-- * 승인·반려·수정은 함수(RPC) 하나로 「바꾸기 + 기록 남기기」를 한 번에 한다(반쪽 처리 방지).

create type staff_role as enum ('owner', 'moderator', 'crew');
create type flag_kind as enum ('owner', 'wrong', 'photo', 'system');
create type flag_status as enum ('open', 'done');
create type candidate_status as enum ('new', 'assigned', 'confirmed', 'duplicate', 'skip');

-- ───────── 운영하는 사람 ─────────
create table staff (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role         staff_role not null,
  area         text,                       -- 크루가 맡은 구 (mapo …), 없으면 전체
  active       boolean not null default true,
  invited_by   uuid references auth.users (id),
  created_at   timestamptz not null default now()
);

-- 지금 로그인한 사람의 역할 (없으면 null)
create or replace function staff_role_of_me() returns staff_role
language sql stable security definer set search_path = public as $$
  select role from staff where user_id = auth.uid() and active
$$;

create or replace function is_staff(min_role staff_role default 'crew') returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select case min_role
              when 'crew' then true
              when 'moderator' then role in ('owner', 'moderator')
              when 'owner' then role = 'owner'
            end
     from staff where user_id = auth.uid() and active),
    false)
$$;

-- ───────── 운영 기록 (지울 수 없음) ─────────
create table audit_logs (
  id          bigint generated always as identity primary key,
  actor       uuid references auth.users (id),   -- null = 시스템(자동 반영·자동 차단)
  action      text not null,                     -- report.approve · report.reject · store.update · store.hide · device.block · staff.role …
  target_type text not null,                     -- report · store · flag · device · staff
  target_id   text not null,
  before      jsonb,                             -- 바뀌기 전 값 (되돌리기에 씀)
  after       jsonb,
  reason      text,
  created_at  timestamptz not null default now()
);
create index audit_logs_target_idx on audit_logs (target_type, target_id, created_at desc);
create index audit_logs_actor_idx on audit_logs (actor, created_at desc);

-- 고치기·지우기를 DB 가 막는다
create or replace function audit_logs_append_only() returns trigger language plpgsql as $$
begin
  raise exception 'audit_logs 는 추가만 할 수 있어요';
end $$;
create trigger audit_logs_no_update before update or delete on audit_logs
  for each row execute function audit_logs_append_only();

-- ───────── 제보 처리 칸 더하기 ─────────
alter table reports
  add column reject_reason text,
  add column same_key text,                    -- 같은 내용 묶음 열쇠 (예: closed:가게id). 3건 이상이면 맨 위로
  add column flags text[] not null default '{}'; -- dup_suspect · spam_device · far_pin
create index reports_same_key_idx on reports (same_key) where status = 'pending';

-- ───────── 신고·요청 ─────────
-- 사장님 요청만 자유 글을 받는다. 연락처는 꼭 필요할 때만, 운영자만 본다.
create table flags (
  id          bigint generated always as identity primary key,
  kind        flag_kind not null,
  store_id    uuid references stores (id) on delete set null,
  report_id   bigint references reports (id) on delete set null,
  summary     text not null check (char_length(summary) <= 500),
  contact     text,                            -- [확인필요] 사장님 연락처를 받을지. 받으면 처리 후 30일 뒤 지움
  status      flag_status not null default 'open',
  handled_by  uuid references auth.users (id),
  handled_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index flags_open_idx on flags (created_at) where status = 'open';

-- ───────── 차단 기기 ─────────
create table device_blocks (
  id          bigint generated always as identity primary key,
  device_hash text,
  ip_hash     text,
  reason      text not null,
  until       timestamptz,                     -- null = 계속
  blocked_by  uuid references auth.users (id), -- null = 자동(하루 한도 초과)
  created_at  timestamptz not null default now(),
  check (device_hash is not null or ip_hash is not null)
);
create index device_blocks_device_idx on device_blocks (device_hash);

-- ───────── 신선도 점검 맡기기 ─────────
create table check_tasks (
  id          bigint generated always as identity primary key,
  store_id    uuid not null references stores (id) on delete cascade,
  assignee    uuid references auth.users (id),
  due         date,
  done_at     timestamptz,
  method      text check (method in ('phone', 'visit', 'map')),
  created_at  timestamptz not null default now()
);

-- ───────── 공공데이터 후보 (M4) ─────────
create table candidates (
  id          bigint generated always as identity primary key,
  source      text not null default 'data.go.kr',
  source_id   text,                            -- 인허가 관리번호
  name        text not null,
  address     text not null,
  location    extensions.geography(point, 4326),
  biz_kind    text,                            -- 업태 (분식 …)
  status      candidate_status not null default 'new',
  assignee    uuid references auth.users (id),
  store_id    uuid references stores (id),     -- 등록됐거나 겹치는 가게
  raw         jsonb,
  created_at  timestamptz not null default now(),
  unique (source, source_id)
);

-- ───────── 처리 함수 예: 새 가게 제보 승인 ─────────
-- 바꾸기와 기록을 한 번에. 다른 운영자가 먼저 처리했으면 막는다(경고창 #2).
create or replace function approve_new_store(p_report_id bigint, p_store jsonb)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_store_id uuid; v_status report_status;
begin
  if not is_staff('moderator') then raise exception '권한이 없어요'; end if;
  select status into v_status from reports where id = p_report_id for update;
  if v_status is distinct from 'pending' then raise exception '이미 처리된 제보예요'; end if;

  insert into stores (slug, name, grade, location, address, gu, dong, rice, style, spice, taste, sides, shop_type, usage, price, price_checked_at, hours, last_confirmed_at, source)
  values (p_store->>'slug', p_store->>'name', (p_store->>'grade')::store_grade,
          st_setsrid(st_makepoint((p_store->>'lng')::float8, (p_store->>'lat')::float8), 4326)::geography,
          p_store->>'address', p_store->>'gu', p_store->>'dong',
          array(select jsonb_array_elements_text(p_store->'rice')), p_store->>'style', (p_store->>'spice')::smallint,
          array(select jsonb_array_elements_text(coalesce(p_store->'taste', '[]'))),
          array(select jsonb_array_elements_text(coalesce(p_store->'sides', '[]'))),
          p_store->>'shop_type',
          array(select jsonb_array_elements_text(coalesce(p_store->'usage', '[]'))),
          (p_store->>'price')::int, current_date, p_store->'hours', current_date, 'report')
  returning id into v_store_id;

  update reports set status = 'approved', store_id = v_store_id, reviewed_at = now(), reviewed_by = auth.uid() where id = p_report_id;
  insert into audit_logs (actor, action, target_type, target_id, after)
  values (auth.uid(), 'report.approve', 'report', p_report_id::text, jsonb_build_object('store_id', v_store_id, 'store', p_store));
  return v_store_id;
end $$;

-- ───────── 권한 ─────────
alter table staff enable row level security;
alter table audit_logs enable row level security;
alter table flags enable row level security;
alter table device_blocks enable row level security;
alter table check_tasks enable row level security;
alter table candidates enable row level security;

create policy "운영하는 사람은 운영자 목록을 본다" on staff for select to authenticated using (is_staff('crew'));
create policy "관리자만 운영자를 바꾼다" on staff for all to authenticated using (is_staff('owner')) with check (is_staff('owner'));

create policy "운영자 이상은 기록을 본다" on audit_logs for select to authenticated using (is_staff('moderator'));
create policy "운영하는 사람은 기록을 더한다" on audit_logs for insert to authenticated with check (is_staff('crew') and actor = auth.uid());

create policy "운영자 이상: 제보 읽기·처리" on reports for all to authenticated using (is_staff('moderator')) with check (is_staff('moderator'));
create policy "운영자 이상: 신고·요청" on flags for all to authenticated using (is_staff('moderator')) with check (is_staff('moderator'));
create policy "운영자 이상: 차단" on device_blocks for all to authenticated using (is_staff('moderator')) with check (is_staff('moderator'));
create policy "운영자 이상: 후보" on candidates for all to authenticated using (is_staff('moderator')) with check (is_staff('moderator'));

-- 크루: 자기에게 맡겨진 점검만 보고 끝낸다. 가게 수정은 운영하는 사람 모두 (변경은 audit_logs 로 남김)
create policy "점검: 운영자 이상은 전부, 크루는 내 것" on check_tasks for all to authenticated
  using (is_staff('moderator') or (is_staff('crew') and assignee = auth.uid()))
  with check (is_staff('moderator') or (is_staff('crew') and assignee = auth.uid()));
create policy "운영하는 사람은 숨긴 가게까지 본다" on stores for select to authenticated using (is_staff('crew'));
create policy "운영하는 사람은 가게를 고친다" on stores for update to authenticated using (is_staff('crew')) with check (is_staff('crew'));
create policy "운영하는 사람은 메뉴를 고친다" on menu_items for all to authenticated using (is_staff('crew')) with check (is_staff('crew'));

-- 2026-10-30 Supabase 규칙: Data API 로 쓰려면 표마다 GRANT 를 직접 준다
grant select, insert, update on staff, flags, device_blocks, check_tasks, candidates to authenticated;
grant select, insert on audit_logs to authenticated;
grant select, update on reports to authenticated;
grant update on stores to authenticated;
grant select, insert, update, delete on menu_items to authenticated;
grant execute on function is_staff(staff_role), staff_role_of_me(), approve_new_store(bigint, jsonb) to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
