# Zadok Farm

The public commerce website and operational web application for Zadok Farm.

## Current foundation

- Next.js 16 App Router
- Supabase Postgres, Auth and Storage
- Product-first public catalogue
- Planned WhatsApp order-request handoff
- Admin and staff operations without customer accounts

## Getting Started

Copy `.env.example` to `.env.local` and provide the Zadok Supabase project URL and publishable key. Never expose a secret or service-role key through a `NEXT_PUBLIC_` variable.

Install dependencies and run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database workflow

All schema changes must be represented by files in `supabase/migrations`. Create migrations with:

```bash
npx supabase migration new descriptive_name
```

Generate database types again whenever a migration changes the public schema.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
