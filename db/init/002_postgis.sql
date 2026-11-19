-- 위치 (PostGIS) — 지도 화면 범위 · 반경 검색을 DB 에서 하기 위한 준비 (기술스택 문서: Supabase Postgres + PostGIS).
-- 앱은 아직 lat · lng 만 쓴다. location 은 lat · lng 가 바뀔 때 저절로 채워진다.
-- 11-09: PostGIS 를 public 이 아니라 extensions 칸(스키마)에 깐다 (Supabase 권장 — public 에 깔면 spatial_ref_sys 표가 공개 키로 열린다).
--        그래서 위치 칸 종류는 extensions.geography 로 적고, 함수마다 search_path 에 extensions 를 넣는다.
--        Supabase 에는 extensions 칸이 이미 있다. 없는 DB(CI)에서는 아래 첫 줄이 만든다.

create schema if not exists extensions;
create extension if not exists postgis with schema extensions;

alter table stores add column location extensions.geography(Point, 4326);

create or replace function stores_set_location() returns trigger language plpgsql
set search_path = public, extensions as $$
begin
  new.location := ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326)::geography;
  return new;
end $$;

create trigger stores_location
  before insert or update of lat, lng on stores
  for each row execute function stores_set_location();

create index stores_location_idx on stores using gist (location);

-- 화면에 보이는 범위 안의 가게 (지도 홈이 나중에 쓸 함수)
create or replace function stores_in_bounds(min_lng double precision, min_lat double precision, max_lng double precision, max_lat double precision)
returns setof stores language sql stable
set search_path = public, extensions as $$
  select * from stores
  where coalesce(status, 'active') = 'active'
    and location && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography
$$;

-- 한 점에서 반경 m 안의 가게, 가까운 순 (「아직 있어요」 거리 확인 · 가까운순)
create or replace function stores_near(p_lng double precision, p_lat double precision, radius_m double precision)
returns table (id text, name text, distance_m double precision) language sql stable
set search_path = public, extensions as $$
  select s.id, s.name, ST_Distance(s.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) as distance_m
  from stores s
  where ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, radius_m)
  order by distance_m
$$;
