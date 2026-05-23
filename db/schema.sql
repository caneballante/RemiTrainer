create extension if not exists pgcrypto;

create table if not exists household (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  id text primary key,
  household_id text not null references household(id) on delete cascade,
  name text not null,
  age integer,
  sex text,
  weight numeric,
  fitness_level text,
  goals text,
  preferred_workout_style text,
  preferred_mix text,
  injuries_or_limitations text,
  exercises_to_avoid text,
  permanently_banned_exercises text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists household_equipment (
  household_id text not null references household(id) on delete cascade,
  equipment_id text not null,
  available boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (household_id, equipment_id)
);

create table if not exists profile_limitations (
  id text primary key,
  profile_id text not null references profiles(id) on delete cascade,
  type text not null,
  value text not null,
  severity text,
  created_at timestamptz not null default now()
);

create table if not exists profile_banned_exercises (
  id text primary key,
  profile_id text not null references profiles(id) on delete cascade,
  exercise_id text not null,
  exercise_name text not null,
  banned_at timestamptz not null default now(),
  reason text,
  unique (profile_id, exercise_id)
);

create table if not exists shared_workout_sessions (
  id text primary key,
  household_id text not null references household(id) on delete cascade,
  requested_at timestamptz not null default now(),
  request jsonb not null,
  compact_context jsonb not null,
  parent_workout_plan jsonb not null,
  original_ai_response jsonb,
  final_validated_workout jsonb not null,
  source text not null default 'openai'
);

create table if not exists shared_workout_invites (
  id text primary key,
  shared_workout_session_id text not null references shared_workout_sessions(id) on delete cascade,
  from_profile_id text not null references profiles(id) on delete cascade,
  to_profile_id text not null references profiles(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  opened_at timestamptz,
  dismissed_at timestamptz,
  unique (shared_workout_session_id, to_profile_id)
);

create table if not exists user_workout_instances (
  id text primary key,
  shared_workout_session_id text not null references shared_workout_sessions(id) on delete cascade,
  profile_id text not null references profiles(id) on delete cascade,
  estimated_minutes integer,
  adaptation_notes jsonb not null default '[]'::jsonb,
  warmup jsonb not null default '[]'::jsonb,
  cooldown jsonb not null default '[]'::jsonb,
  exercises jsonb not null default '[]'::jsonb
);

create table if not exists workout_exercise_instances (
  id text primary key,
  shared_workout_session_id text not null references shared_workout_sessions(id) on delete cascade,
  user_workout_instance_id text not null references user_workout_instances(id) on delete cascade,
  profile_id text not null references profiles(id) on delete cascade,
  parent_slot_id text,
  movement_pattern text not null,
  exercise_id text not null,
  exercise_name text not null,
  sets integer,
  reps text,
  rest_seconds integer,
  required_equipment jsonb not null default '[]'::jsonb,
  substitution_reason text,
  completed_at timestamptz
);

create table if not exists exercise_feedback (
  id text primary key,
  profile_id text not null references profiles(id) on delete cascade,
  shared_workout_session_id text references shared_workout_sessions(id) on delete cascade,
  user_workout_instance_id text references user_workout_instances(id) on delete cascade,
  workout_exercise_instance_id text references workout_exercise_instances(id) on delete cascade,
  exercise_id text not null,
  exercise_name text,
  rating text not null,
  logged_at timestamptz not null default now()
);

create table if not exists exercise_instruction_assets (
  exercise_id text primary key,
  instruction_image_url text,
  image_prompt text,
  steps jsonb not null default '[]'::jsonb,
  easier_version text,
  harder_version text,
  common_mistakes jsonb not null default '[]'::jsonb,
  safety_notes jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists shared_workout_sessions_household_requested_idx
  on shared_workout_sessions (household_id, requested_at desc);

create index if not exists shared_workout_invites_to_status_idx
  on shared_workout_invites (to_profile_id, status, created_at desc);

create index if not exists workout_exercise_instances_profile_pattern_idx
  on workout_exercise_instances (profile_id, movement_pattern);

create index if not exists exercise_feedback_profile_logged_idx
  on exercise_feedback (profile_id, logged_at desc);
