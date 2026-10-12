-- ===========================================================
-- הרץ את זה בסופאבייס SQL Editor
-- ===========================================================

-- 1. טבלת משרדים (כל עסק/משרד עו"ד)
create table if not exists firms (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  name text not null,
  email text not null unique,
  status text default 'active' -- active | suspended
);

-- 2. טבלת פרופילים (מקשרת auth.users למשרד + תפקיד)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamp with time zone default now(),
  firm_id uuid references firms(id) on delete cascade,
  role text default 'firm' -- 'admin' | 'firm'
);

-- 3. הוספת firm_id לכל הטבלאות הקיימות
alter table clients  add column if not exists firm_id uuid references firms(id) on delete cascade;
alter table tasks    add column if not exists firm_id uuid references firms(id) on delete cascade;
alter table notes    add column if not exists firm_id uuid references firms(id) on delete cascade;
alter table documents add column if not exists firm_id uuid references firms(id) on delete cascade;

-- יצירת טבלת meetings אם לא קיימת
create table if not exists meetings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  client_id uuid references clients(id) on delete cascade,
  title text,
  date text,
  time text,
  duration text,
  status text default 'scheduled',
  firm_id uuid references firms(id) on delete cascade
);
alter table meetings add column if not exists firm_id uuid references firms(id) on delete cascade;

-- 4. פונקציה לשליפת firm_id של המשתמש המחובר (מהירה, ממטמונת)
create or replace function get_my_firm_id()
returns uuid as $$
  select firm_id from profiles where id = auth.uid()
$$ language sql security definer stable;

-- 5. RLS - Enable
alter table firms    enable row level security;
alter table profiles enable row level security;
alter table meetings enable row level security;

-- 6. מחק policies ישנות כלליות
drop policy if exists "Allow all clients"   on clients;
drop policy if exists "Allow all documents" on documents;
drop policy if exists "Allow all tasks"     on tasks;
drop policy if exists "Allow all notes"     on notes;

-- 7. policies חדשות - בידוד לפי firm_id
-- קריאה ועדכון רק לנתונים של אותו משרד
-- אדמין רואה הכל

create policy "firm_clients" on clients for all using (
  firm_id = get_my_firm_id()
  or exists(select 1 from profiles where id = auth.uid() and role = 'admin')
) with check (
  firm_id = get_my_firm_id()
  or exists(select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "firm_tasks" on tasks for all using (
  firm_id = get_my_firm_id()
  or exists(select 1 from profiles where id = auth.uid() and role = 'admin')
) with check (
  firm_id = get_my_firm_id()
  or exists(select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "firm_notes" on notes for all using (
  firm_id = get_my_firm_id()
  or exists(select 1 from profiles where id = auth.uid() and role = 'admin')
) with check (
  firm_id = get_my_firm_id()
  or exists(select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "firm_documents" on documents for all using (
  firm_id = get_my_firm_id()
  or exists(select 1 from profiles where id = auth.uid() and role = 'admin')
) with check (
  firm_id = get_my_firm_id()
  or exists(select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "firm_meetings" on meetings for all using (
  firm_id = get_my_firm_id()
  or exists(select 1 from profiles where id = auth.uid() and role = 'admin')
) with check (
  firm_id = get_my_firm_id()
  or exists(select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- profiles: כל אחד רואה את עצמו, אדמין רואה הכל
create policy "own_profile" on profiles for select using (
  id = auth.uid()
  or exists(select 1 from profiles p2 where p2.id = auth.uid() and p2.role = 'admin')
);
create policy "admin_manage_profiles" on profiles for all using (
  exists(select 1 from profiles p2 where p2.id = auth.uid() and p2.role = 'admin')
) with check (
  exists(select 1 from profiles p2 where p2.id = auth.uid() and p2.role = 'admin')
);

-- firms: כל אחד רואה את המשרד שלו, אדמין רואה הכל
create policy "own_firm" on firms for select using (
  id = get_my_firm_id()
  or exists(select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "admin_manage_firms" on firms for all using (
  exists(select 1 from profiles where id = auth.uid() and role = 'admin')
) with check (
  exists(select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ===========================================================
-- אחרי ההרצה:
-- 1. צור משתמש אדמין ב-Supabase Authentication > Users
-- 2. הרץ את ה-SQL הבא עם המייל שלך:
-- ===========================================================
-- insert into firms (name, email) values ('Admin', 'YOUR_ADMIN_EMAIL@gmail.com') returning id;
-- -- קח את ה-id שחזר, ואחרי שנרשמת הרץ:
-- insert into profiles (id, firm_id, role)
--   select id, 'FIRM_ID_FROM_ABOVE', 'admin' from auth.users where email = 'YOUR_ADMIN_EMAIL@gmail.com';
