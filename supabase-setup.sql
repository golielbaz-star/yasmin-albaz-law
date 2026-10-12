-- טבלת לקוחות
create table clients (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  name text not null,
  phone text not null,
  email text,
  id_number text,
  address text,
  field text,
  status text default 'onboarding',
  summary text,
  critical_dates text,
  fee_model text,
  total_fee text,
  paid_so_far text default '₪0',
  balance_due text,
  source text default 'manual'
);

-- טבלת מסמכים
create table documents (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  client_id uuid references clients(id) on delete cascade,
  name text not null,
  file_path text not null,
  file_type text,
  uploaded_at text
);

-- טבלת משימות
create table tasks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  due_date text,
  completed boolean default false
);

-- טבלת הערות
create table notes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  client_id uuid references clients(id) on delete cascade,
  author text default 'עו"ד',
  text text not null
);

-- Storage bucket לקבצים
insert into storage.buckets (id, name, public)
values ('client-files', 'client-files', true);

-- פתיחת הרשאות קריאה לכולם (הקבצים ציבוריים לקריאה)
create policy "Public read" on storage.objects
  for select using (bucket_id = 'client-files');

-- פתיחת הרשאות העלאה לכולם (הטופס הציבורי)
create policy "Public upload" on storage.objects
  for insert with check (bucket_id = 'client-files');

-- RLS - הרשאות לטבלאות (אפשר הכל כרגע)
alter table clients enable row level security;
alter table documents enable row level security;
alter table tasks enable row level security;
alter table notes enable row level security;

create policy "Allow all clients" on clients for all using (true) with check (true);
create policy "Allow all documents" on documents for all using (true) with check (true);
create policy "Allow all tasks" on tasks for all using (true) with check (true);
create policy "Allow all notes" on notes for all using (true) with check (true);
