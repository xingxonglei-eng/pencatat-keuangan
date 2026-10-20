create table transactions (
  id bigint generated always as identity primary key,
  title text not null,
  amount numeric not null check (amount > 0),
  type text not null check (type in ('income','expense')),
  category text not null default 'Lainnya',
  date date not null default current_date,
  created_at timestamptz default now()
);
-- Kunci tabel dari akses publik; hanya backend (service key) yang boleh akses
alter table transactions enable row level security;
