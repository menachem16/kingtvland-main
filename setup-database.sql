-- ========================================
-- Setup Script for Subscription System
-- Run this in Supabase SQL Editor
-- ========================================

-- Create subscription_plans table
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_he text not null,
  description text,
  description_he text,
  price decimal(10,2) not null,
  currency text default 'ILS',
  features jsonb,
  is_active boolean default true,
  stripe_price_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscription_plans enable row level security;

create policy "Anyone can view active subscription plans"
  on public.subscription_plans for select
  using (is_active = true);

create policy "Admins can manage subscription plans"
  on public.subscription_plans for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- Create subscriptions table
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_id uuid references public.subscription_plans(id) not null,
  status text not null check (status in ('active', 'cancelled', 'expired', 'pending')),
  start_date timestamptz not null default now(),
  end_date timestamptz,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Admins can view all subscriptions"
  on public.subscriptions for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid()
      and profiles.is_admin = true
    )
  );

create policy "System can manage subscriptions"
  on public.subscriptions for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- Create orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subscription_plan_id uuid references public.subscription_plans(id),
  total_amount decimal(10,2) not null,
  discount_amount decimal(10,2) default 0,
  final_amount decimal(10,2) not null,
  currency text default 'ILS',
  payment_status text not null check (payment_status in ('pending', 'completed', 'failed', 'refunded')),
  payment_method text,
  coupon_code text,
  stripe_payment_intent_id text,
  stripe_session_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Admins can view all orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid()
      and profiles.is_admin = true
    )
  );

create policy "System can create orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Admins can update orders"
  on public.orders for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- Create coupons table
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value decimal(10,2) not null,
  max_uses integer,
  used_count integer default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.coupons enable row level security;

-- Create function to check if user is admin
create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
    and is_admin = true
  )
$$;

-- RLS Policies for coupons
create policy "Admins can manage coupons"
  on public.coupons for all
  using (public.is_admin_user());

create policy "Public can validate active coupons"
  on public.coupons for select
  using (
    is_active = true
    and (valid_from is null or valid_from <= now())
    and (valid_until is null or valid_until >= now())
    and (max_uses is null or used_count < max_uses)
  );

-- Insert subscription plans: King, Israel, Premium
insert into public.subscription_plans (name, name_he, description, description_he, price, currency, features, is_active) values
('King', 'מלך', 'Premium subscription with all features', 'מנוי פרימיום עם כל התכונות', 499.00, 'ILS', 
  '["גישה מלאה לכל התכונות", "תמיכה מועדפת 24/7", "עדכונים בלעדיים", "ללא הגבלת שימוש", "אחסון בענן ללא הגבלה"]'::jsonb, true),
  
('Israel', 'ישראל', 'Standard subscription for Israeli users', 'מנוי סטנדרטי למשתמשים בישראל', 299.00, 'ILS',
  '["גישה לכל התכונות הבסיסיות", "תמיכה בשעות העבודה", "עדכונים חודשיים", "עד 50GB אחסון"]'::jsonb, true),
  
('Premium', 'פרימיום', 'Enhanced subscription with advanced features', 'מנוי משודרג עם תכונות מתקדמות', 399.00, 'ILS',
  '["גישה לתכונות מתקדמות", "תמיכה מהירה", "עדכונים שבועיים", "עד 100GB אחסון", "גיבויים אוטומטיים"]'::jsonb, true)
on conflict do nothing;

-- Create indexes
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_coupons_code on public.coupons(code);

-- Create updated_at triggers
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.subscription_plans
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.subscriptions
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.orders
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.coupons
  for each row execute function public.handle_updated_at();

-- Set admin status for admin@gmail.com (run after user signs up)
-- UPDATE public.profiles 
-- SET is_admin = true 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@gmail.com');
