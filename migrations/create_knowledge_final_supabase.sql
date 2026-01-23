-- Enable Extensions (Required for Vectors)
create extension if not exists vector;

-- 1. Create Storage Bucket (If not exists)
-- Note: SQL creation of buckets requires 'storage' schema access.
insert into storage.buckets (id, name, public)
values ('knowledge', 'knowledge', true)
on conflict (id) do nothing;

-- 2. Storage Policies (Allow Upload/Read)
-- Allow Authenticated users to upload
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'knowledge' );

-- Allow Public Read (or Authenticated Read)
create policy "Allow public read"
on storage.objects for select
to public
using ( bucket_id = 'knowledge' );

-- 3. Create Tables for Knowledge Base
create table if not exists ai_knowledge_docs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_url text, 
  file_type text not null, -- 'pdf', 'text'
  status text not null default 'processing', -- 'processing', 'ready', 'error'
  error_message text,
  char_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists ai_knowledge_vectors (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid references ai_knowledge_docs(id) on delete cascade not null,
  content text not null, 
  embedding vector(768), -- Gemini Embedding Size
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Indexes
create index if not exists ai_vectors_embedding_idx on ai_knowledge_vectors using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- 5. RLS Policies
alter table ai_knowledge_docs enable row level security;
alter table ai_knowledge_vectors enable row level security;

-- Policy: Admin/Instructor can manage docs
create policy "Admin manage docs"
on ai_knowledge_docs
for all
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role in ('admin', 'instructor')
  )
);

-- Policy: Authenticated users can read vectors (for chat usage)
create policy "Auth read vectors"
on ai_knowledge_vectors
for select
to authenticated
using (true);

-- 6. Match Function (For RAG Search)
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  doc_id uuid,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    v.id,
    v.content,
    v.doc_id,
    1 - (v.embedding <=> query_embedding) as similarity
  from ai_knowledge_vectors v
  where 1 - (v.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
