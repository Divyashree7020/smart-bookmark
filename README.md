# Smart Bookmark App

A full-stack bookmark manager built with:

- Next.js (App Router)
- Supabase (Auth + Database + Realtime)
- Google OAuth
- Tailwind CSS
- Vercel (Deployment)

---

## Live Demo

https://smart-bookmark-beryl.vercel.app


##  GitHub Repository

https://github.com/Divyashree7020/smart-bookmark


--> Features

- Google Authentication (Supabase Auth)
- Row Level Security (RLS)
- Add / Delete Bookmarks
- Realtime updates across tabs
- Search functionality
- Protected dashboard per user



## Problems Faced & Solutions

1. Realtime not updating in second tab
Problem: Second tab required refresh to show new bookmarks.  
Solution: Implemented Supabase Realtime subscription using `postgres_changes` filtered by `user_id`.


2. TypeScript Build Error on Deployment
Problem:`string | undefined` not assignable to `string | null`.  
Solution: Used: setEmail(data.user.email ?? null).


3. OAuth Redirect Issues After Deployment
Problem: Google login failed on production.
Solution: Added Vercel production URL in Supabase:
Site URL
Redirect URLs
/auth/callback





