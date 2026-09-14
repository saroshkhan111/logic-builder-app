# Prisma + Supabase Setup Guide

## ✅ Installation Complete

The following packages have been installed:
- `prisma@^7.10.0` (dev dependency)
- `@prisma/client@^7.10.0` (dependency)

## 📁 Files Created

1. **`prisma/schema.prisma`** - Prisma schema configuration
2. **`.env`** - Environment variables (contains DATABASE_URL)
3. **`src/lib/prisma.ts`** - Prisma client singleton instance

## 🔧 Configuration

### 1. Get Your Supabase Database Password

1. Go to your Supabase project: https://supabase.com/dashboard/project/bfbtlomofjtqvkzrwrrp
2. Navigate to **Settings** → **Database**
3. Copy your database password (or reset it if you don't have it)

### 2. Update Environment Variables

Edit the `.env` file and replace `[YOUR-PASSWORD]` with your actual Supabase database password:

```env
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.bfbtlomofjtqvkzrwrrp.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.bfbtlomofjtqvkzrwrrp.supabase.co:5432/postgres"
```

**Important:** Never commit your `.env` file to version control (it's already in `.gitignore`)

## 📝 Available NPM Scripts

```bash
# Generate Prisma Client (run after schema changes)
npm run db:generate

# Push schema changes to database (no migration files)
npm run db:push

# Create and run migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database
npm run db:seed
```

## 🚀 Next Steps

### 1. Generate Prisma Client

After setting your DATABASE_URL, generate the Prisma Client:

```bash
npm run db:generate
```

### 2. Define Your Schema

Edit `prisma/schema.prisma` to add your models. Example:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Workflow {
  id          String   @id @default(cuid())
  name        String
  description String?
  nodes       Json     @default("[]")
  edges       Json     @default("[]")
  userId      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 3. Push Schema to Database

Push your schema to Supabase:

```bash
npm run db:push
```

Or create a migration:

```bash
npm run db:migrate
```

### 4. Use Prisma Client in Your App

Import the Prisma client singleton:

```typescript
import { prisma } from '@/lib/prisma';

// In API routes or server components
export async function GET() {
  const users = await prisma.user.findMany();
  return Response.json(users);
}
```

## 📚 Usage Examples

### Server Actions (Next.js 15+)

```typescript
'use server';

import { prisma } from '@/lib/prisma';

export async function createWorkflow(name: string, description?: string) {
  return await prisma.workflow.create({
    data: {
      name,
      description,
      nodes: [],
      edges: [],
    },
  });
}

export async function getWorkflows() {
  return await prisma.workflow.findMany({
    orderBy: { updatedAt: 'desc' },
  });
}
```

### API Routes

```typescript
// app/api/workflows/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const workflows = await prisma.workflow.findMany();
    return NextResponse.json(workflows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const workflow = await prisma.workflow.create({
      data: body,
    });
    return NextResponse.json(workflow);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}
```

## 🔍 Prisma Studio

To visually explore and edit your database, run:

```bash
npm run db:studio
```

This will open Prisma Studio at http://localhost:5555

## 📖 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase + Prisma Guide](https://supabase.com/docs/guides/integrations/prisma)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Next.js + Prisma Best Practices](https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices)

## ⚠️ Important Notes

### Connection Pooling

Supabase uses connection pooling. The `directUrl` is configured to bypass pooling for:
- Running migrations
- Using Prisma Studio
- Database introspection

### Development vs Production

- In development, Prisma logs all queries for debugging
- In production, only errors are logged
- The Prisma client is cached globally in development to prevent hot-reload issues

## 🐛 Troubleshooting

### Error: "Can't reach database server"

1. Check your database password in `.env`
2. Verify your Supabase project is active (not paused)
3. Ensure your IP is not blocked by Supabase

### Error: "Environment variable not found: DATABASE_URL"

Make sure your `.env` file exists and contains the DATABASE_URL variable.

### After schema changes, client is outdated

Run `npm run db:generate` to regenerate the Prisma Client.

## ✨ What's Next?

1. Set your DATABASE_URL in `.env`
2. Define your data models in `prisma/schema.prisma`
3. Run `npm run db:generate`
4. Run `npm run db:push` to sync with database
5. Start building your features with type-safe database queries!
