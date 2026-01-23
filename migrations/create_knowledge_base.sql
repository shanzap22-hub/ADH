-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store knowledge base documents
create table if not exists ai_knowledge_docs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_url text, -- URL to the file in storage (e.g. Bunny)
  file_type text not null, -- 'pdf', 'text', 'docx'
  status text not null default 'processing', -- 'processing', 'ready', 'error'
  error_message text,
  char_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table to store vector embeddings for chunks of documents
create table if not exists ai_knowledge_vectors (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid references ai_knowledge_docs(id) on delete cascade not null,
  content text not null, -- The actual text chunk
  embedding vector(768), -- Gemini embedding dimension is 768
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster vector similarity search
create index on ai_knowledge_vectors using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create a function to search for similar documents
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

-- RLS Policies
alter table ai_knowledge_docs enable row level security;
alter table ai_knowledge_vectors enable row level security;

-- Allow admins to do everything
create policy "Admins can manage knowledge docs"
  on ai_knowledge_docs
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'instructor')
    )
  );

-- Allow everyone (authenticated) to read vectors (via the function typically, but RLS applies to selects)
-- Actually, the search function runs with invoker rights by default.
-- Users don't query this table directly usually, the API does with service role or user role.
-- Let's allow read for auth users for now just in case.
create policy "Authenticated users can read vectors"
  on ai_knowledge_vectors
  for select
  to authenticated
  using (true);
