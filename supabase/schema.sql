-- OffCourt Drop Club — Supabase setup (1st year capstone)
-- Run this in Supabase → SQL Editor after creating a project.

-- ── Products (same IDs as the original site) ─────────────────
create table if not exists products (
  id          text primary key,
  name        text not null,
  brand       text not null,
  cat         text not null,
  price       int  not null,
  old_price   int,
  rating      numeric(2,1) default 4.5,
  reviews     int default 0,
  img         text not null,
  badge       text,
  feat        boolean default false,
  drop_date   date
);

-- ── Member profile (shoe size for checkout) ──────────────────
create table if not exists profiles (
  id         uuid primary key references auth.users on delete cascade,
  name       text,
  shoe_size  text,
  updated_at timestamptz default now()
);

-- ── Drop waitlist (unique feature) ───────────────────────────
create table if not exists drop_waitlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  product_id text not null references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, product_id)
);

-- ── Orders + line items ──────────────────────────────────────
create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  order_number   text not null,
  subtotal       numeric(10,2) not null,
  shipping_cost  numeric(10,2) default 0,
  total          numeric(10,2) not null,
  delivery_type  text not null default 'ship',
  first_name     text,
  last_name      text,
  email          text,
  address        text,
  city           text,
  pin            text,
  status         text default 'confirmed',
  created_at     timestamptz default now()
);

create table if not exists order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  product_id text,
  name       text not null,
  brand      text,
  price      numeric(10,2) not null,
  qty        int not null default 1,
  img        text
);

-- ── Contact form inbox ───────────────────────────────────────
create table if not exists contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text,
  message    text not null,
  created_at timestamptz default now()
);

-- ── Row Level Security ─────────────────────────────────────────
alter table products enable row level security;
alter table profiles enable row level security;
alter table drop_waitlist enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table contact_messages enable row level security;

create policy "products are public" on products for select using (true);

create policy "profiles read own" on profiles for select using (auth.uid() = id);
create policy "profiles insert own" on profiles for insert with check (auth.uid() = id);
create policy "profiles update own" on profiles for update using (auth.uid() = id);

create policy "waitlist read all" on drop_waitlist for select using (true);
create policy "waitlist insert own" on drop_waitlist for insert with check (auth.uid() = user_id);
create policy "waitlist delete own" on drop_waitlist for delete using (auth.uid() = user_id);

create policy "orders read own" on orders for select using (auth.uid() = user_id);
create policy "orders insert own" on orders for insert with check (auth.uid() = user_id);

create policy "order_items read own" on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "order_items insert own" on order_items for insert with check (
  exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
);

create policy "contact anyone can send" on contact_messages for insert with check (true);

-- ── Seed products (limited rows include drop_date) ───────────
insert into products (id, name, brand, cat, price, old_price, rating, reviews, img, badge, feat, drop_date) values
('1','Cloud Stratus Elite','On','running',289,null,4.8,342,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80','new',true,null),
('2','UltraBoost 24','Adidas','running',220,280,4.9,1205,'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80','sale',false,null),
('3','Vaporfly Next%','Nike','running',275,null,4.7,892,'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80','new',true,null),
('4','Fresh Foam X 1080v13','New Balance','running',185,null,4.6,567,'https://images.unsplash.com/photo-1465453869711-7e174808ace9?w=600&q=80',null,false,null),
('5','Gel-Kayano 30','ASICS','running',195,230,4.5,423,'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80','sale',false,null),
('6','Air Force 1 ''07 Premium','Nike','casual',145,null,4.9,2341,'https://images.unsplash.com/photo-1626379637476-f78d1d86b9f3?w=600&q=80',null,true,null),
('7','Stan Smith Lux','Adidas','casual',165,null,4.7,1876,'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80',null,false,null),
('8','550 Heritage','New Balance','casual',150,180,4.8,987,'https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=600&q=80','sale',true,null),
('9','Old Skool Premium','Vans','casual',95,null,4.6,1543,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80',null,false,null),
('10','Chuck 70 Hi','Converse','casual',110,null,4.5,2109,'https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=600&q=80',null,false,null),
('11','LeBron XXI','Nike','basketball',225,null,4.8,654,'https://images.unsplash.com/photo-1552346053-c33aa8b3d665?w=600&q=80','new',true,null),
('12','Curry 11','Under Armour','basketball',180,null,4.7,432,'https://images.unsplash.com/photo-1604726923839-606d2f0e0870?w=600&q=80',null,false,null),
('13','Harden Vol. 8','Adidas','basketball',165,200,4.6,321,'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&q=80','sale',false,null),
('14','KD 16','Nike','basketball',195,null,4.7,287,'https://images.unsplash.com/photo-1602596532816-a5a81fd92c84?w=600&q=80',null,false,null),
('15','Ja 2','Nike','basketball',135,null,4.5,543,'https://images.unsplash.com/photo-1600415503361-ee0a9ec83c86?w=600&q=80',null,false,null),
('16','Yeezy 350 V2','Adidas','lifestyle',290,null,4.8,1876,'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=600&q=80','new',true,null),
('17','Forum 84 Low','Adidas','lifestyle',140,null,4.6,654,'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80',null,false,null),
('18','Dunk Low Retro','Nike','lifestyle',125,155,4.9,3241,'https://images.unsplash.com/photo-1615290642941-36b78b588ca0?w=600&q=80','sale',true,null),
('19','990v6','New Balance','lifestyle',215,null,4.8,876,'https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=600&q=80',null,false,null),
('20','Gel-1130','ASICS','lifestyle',140,170,4.7,543,'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=600&q=80','sale',false,null),
('21','Air Jordan 1 Retro OG','Jordan','limited',380,null,5.0,2341,'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&q=80','lim',true,'2026-06-01'),
('22','Travis Scott x AJ4','Jordan','limited',450,null,4.9,432,'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&q=80','lim',false,'2026-06-15'),
('23','Off-White x Dunk Low','Nike','limited',520,null,4.9,287,'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=600&q=80','lim',false,'2026-07-01'),
('24','sacai x LDWaffle','Nike','limited',340,null,4.8,321,'https://images.unsplash.com/photo-1562613521-6b5293e5b0ea?w=600&q=80','lim',false,'2026-07-20'),
('25','Fear of God Athletics','Adidas','limited',295,null,4.7,198,'https://images.unsplash.com/photo-1617813774819-2b086f744456?w=600&q=80','lim',false,'2026-08-05'),
('26','Endorphin Pro 4','Saucony','running',265,null,4.7,234,'https://images.unsplash.com/photo-1563203444-9e9cf1ec050a?w=600&q=80',null,false,null),
('27','Cloudmonster','On','running',210,250,4.6,456,'https://images.unsplash.com/photo-1632765259214-9afeef8669e2?w=600&q=80','sale',false,null),
('28','Gazelle Indoor','Adidas','casual',120,null,4.8,1234,'https://images.unsplash.com/photo-1514989940723-e8e51d675571?w=600&q=80',null,false,null),
('29','Air Max 90','Nike','casual',155,185,4.7,2341,'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80','sale',false,null),
('30','Samba OG','Adidas','casual',120,null,4.9,3456,'https://images.unsplash.com/photo-1695552835943-cbee8150addc?w=600&q=80',null,true,null)
on conflict (id) do nothing;
