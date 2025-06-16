-- Drop existing policies
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update their own profile." on profiles;

-- Create new policies
create policy "Enable read access for all users"
on profiles for select
using (true);

create policy "Enable insert for authenticated users only"
on profiles for insert
with check (auth.uid() = id);

create policy "Enable update for users based on id"
on profiles for update
using (auth.uid() = id);

-- Enable RLS
alter table profiles enable row level security;

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on profiles to anon, authenticated; 