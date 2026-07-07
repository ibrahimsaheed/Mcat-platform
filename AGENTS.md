<!-MCAT Platform — Agent Instructions

Project context

Full-stack MCAT prep and pre-med application tracker.
Stack: Next.js 14 (App Router) · TypeScript · Tailwind · shadcn/ui · tRPC · Prisma · Supabase · Zustand · Inngest · Resend · PostHog


Non-negotiable rules


Never run npm install and a git command in the same chained command. Run them as separate steps.
Never use && to chain shell commands. Always run one command at a time and wait for confirmation before the next.
Never modify .env.local or .env. Ask me to fill in values manually. You may add new key placeholders but never overwrite existing values.
Never run prisma migrate reset. Always confirm with me before any destructive database operation.
Never delete files without telling me first and getting explicit confirmation.
Never mock data in production code paths. Seed files go in /prisma/seed.ts only.



Code style


All files in TypeScript. No .js files except config files that require it (tailwind.config.js, postcss.config.js).
Use type not interface for object shapes unless extending is required.
Prefer named exports over default exports everywhere except Next.js page and layout files.
No any. Use unknown and narrow it, or define a proper type.
All Zod schemas live in /lib/validators/. Name them [domain].schema.ts.
All tRPC routers live in /server/routers/. One file per domain (e.g. quiz.router.ts, user.router.ts).
Zustand stores live in /store/. One file per domain (e.g. examStore.ts, uiStore.ts).



Prisma rules


Never write raw SQL unless I explicitly ask for it. Use Prisma Client.
After any schema change, remind me to run:

npx prisma generate
npx prisma migrate dev --name <descriptive-name>



Migration names must be descriptive: add_study_plans, not migration1.
Never call prisma.$connect() manually. Use the singleton in /lib/prisma/index.ts.
All DB calls happen server-side only: in tRPC procedures, Server Components, or Inngest functions. Never in Client Components.



tRPC rules


Every procedure must have input validated with Zod.
Mutations that touch sensitive user data must check ctx.user is defined and throw TRPCError({ code: 'UNAUTHORIZED' }) if not.
Keep procedures thin — business logic goes in /server/services/, not inline in the router.
Use protectedProcedure (auth-gated) vs publicProcedure consistently. Never use publicProcedure for anything that touches user data.



Supabase rules


Use createServerComponentClient in Server Components and tRPC context.
Use createClientComponentClient only in Client Components that absolutely need it.
Never use the service role key client-side. It lives server-side only.
Row Level Security is enabled. Never bypass it with the service role key unless writing an Inngest background job that legitimately needs elevated access — and comment why.



Component rules


shadcn/ui components are in /components/ui/ — never edit them directly. Wrap them in /components/ if customization is needed.
Client Components get the "use client" directive as the very first line.
Keep Client Components small. Data fetching and auth happen in Server Components or tRPC hooks.
No inline styles. Tailwind classes only. No arbitrary values like w-[347px] unless there is no utility equivalent.
All form inputs must have accessible labels. No placeholder-only labels.



Mobile responsiveness rules

Every component and page you write must work on mobile. This is non-negotiable.


Always design mobile-first. Write base Tailwind classes for mobile, then layer up with sm:, md:, lg: prefixes. Never write desktop styles first and try to shrink them down.
No fixed pixel widths on containers. Use w-full, max-w-*, or flex-1 instead of w-[600px].
Navigation must collapse on mobile. Any nav with more than 3 items needs a hamburger menu on small screens using a shadcn Sheet component.
Touch targets must be at least 44×44px. Buttons and links need min-h-[44px] min-w-[44px] if they are small by default.
Tables are a mobile problem. Never render a raw <table> on mobile. Either use a card-per-row layout below md:, or wrap the table in overflow-x-auto.
The exam timer and question UI must be fully usable on a phone screen. This is the core feature — test it at 375px width mentally before finishing.
Use Tailwind's responsive grid correctly:

Single column on mobile: grid grid-cols-1
Two columns on tablet: md:grid-cols-2
Three on desktop: lg:grid-cols-3



Before marking any UI task done, mentally check it at three widths: 375px (iPhone SE), 768px (iPad), 1280px (desktop).



Inngest rules


All Inngest functions live in /inngest/functions/. One file per function.
Function IDs must be kebab-case and descriptive: recalculate-score-analytics, not fn1.
Every function must have a retries value set explicitly.
Long-running functions must use step.run() for each logical unit so they are resumable.



File structure reminders

/src
  /app                          # Next.js App Router
    /api/trpc/[trpc]/route.ts   # tRPC handler
    /api/inngest/route.ts        # Inngest handler
  /components
    /ui                         # shadcn primitives (do not edit)
  /lib
    /prisma/index.ts            # Prisma singleton
    /supabase/server.ts         # Server Supabase client
    /supabase/browser.ts        # Browser Supabase client
    /trpc/server.ts             # tRPC init + context
    /trpc/client.ts             # tRPC React client
    /validators/                # Zod schemas
  /server
    /routers/                   # tRPC routers
    /services/                  # Business logic
    /context.ts                 # tRPC context
  /store/                       # Zustand stores
  /inngest/
    /functions/                 # Inngest functions
    client.ts                   # Inngest client
  /types/                       # Shared TS types
/prisma
  schema.prisma
  seed.ts


Teaching mode — always on

I am learning while building this project. Every time you write code or make a decision, explain your reasoning so I understand it, not just the output.

For every file or feature you write:


Open with a 2–3 sentence plain-English summary of what this code does and why it exists.
After writing a function or block that uses a pattern I might not know (e.g. tRPC procedures, Prisma relations, Zustand slices, Server vs Client Components), add a short comment block above it explaining the pattern in simple terms.
If you chose one approach over another (e.g. Server Component instead of Client Component, protectedProcedure instead of publicProcedure), briefly say why.


Format for explanations:
Use a // WHY: comment directly above the relevant code block. Keep it to 1–3 sentences. Example:

ts// WHY: We use a Prisma singleton here instead of calling `new PrismaClient()`
// each time because Next.js hot-reloads in development, which would create
// hundreds of open database connections and exhaust the connection pool.
const prisma = global.prisma ?? new PrismaClient();

For new concepts, go one level deeper:
If you introduce something I haven't seen in this project yet (a new library, a new pattern, a Next.js feature), add a // CONCEPT: comment that explains what it is in one sentence before the // WHY:.

ts// CONCEPT: tRPC middleware lets you run code before every procedure in a router,
// similar to how Express middleware works.
// WHY: We use it here to verify the user is authenticated before any
// protected procedure runs, so we don't repeat that check in every router.

Do not over-explain basic things like variable assignments, imports, or standard TypeScript syntax. Focus explanations on architectural decisions, library-specific patterns, and anything a junior developer would pause at.


When you are unsure


If a task touches the database schema, stop and confirm with me before proceeding.
If a task requires a new environment variable, list the key name and what it does — do not guess a value.
If a feature could be done two ways with meaningful tradeoffs, present both and ask which I prefer before writing code.
If you hit a type error you cannot resolve cleanly, show me the error and your proposed fix before applying it.



What "done" means

A task is done when:


The code compiles with no TypeScript errors (tsc --noEmit passes).
The dev server runs without console errors.
The feature works end-to-end, not just the happy path.
Any new Prisma schema changes have a migration file generated.


Do not say a task is complete until all four are true.- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
