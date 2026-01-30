# FIX SECURITY WARNINGS 🔒

The Supabase Security Advisor is telling you that **Row Level Security (RLS)** is turned OFF for the `courses` and `chapters` tables, even though you have policies defined for them.

This means your security rules are currently **inactive**.

Run this SQL to Fix it:

```sql
-- Enable RLS for courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Enable RLS for chapters
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Recommended: Enable for other tables if missed
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; -- (Likely already on)
-- ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
```

Once you run this, the Errors in Security Advisor will disappear.
