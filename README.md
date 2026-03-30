## DEVMEET.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- Real-time collaborative code editing
- Built-in code execution with multiple language support (using Piston API)
- Live video and chat capabilities
- User authentication and room management

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Database Configuration (if using MongoDB)
MONGODB_URI=your_mongodb_connection_string_here

# Liveblocks Configuration
LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key_here
```

### Code Execution

This project uses the **Piston API** for code execution, which is:
- **Free to use** with generous limits
- **No API key required**
- Supports 30+ programming languages
- Fast and reliable execution

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Routes

- `/api/languages` - Returns supported programming languages for Piston API
- `/api/execute` - Executes code using Piston API
- `/api/auth/[...nextauth]` - NextAuth authentication routes
- `/api/room/*` - Room management endpoints

## Supported Languages

The code execution feature supports the following languages:
- JavaScript (Node.js)
- Python (2.7 & 3.8)
- Java
- C/C++
- C#
- Go
- Rust
- PHP
- Ruby
- TypeScript
- And many more...

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


