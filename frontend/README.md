# QuarkFin Platform Frontend

Modern SaaS platform for risk assessment and fraud prevention built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Split Authentication**: Login/Signup with Google OAuth support
- **Expandable Sidebar**: Collapsible navigation for better UX
- **Platform Services**: Customer Risk, Business Risk, and Lending Risk Prevention
- **Dashboard**: Insights, Transactions, Logs, and Reports
- **AI Support**: Intelligent assistance (Coming Soon)
- **Documentation**: Comprehensive API docs (Coming Soon)
- **Marketplace**: Risk assessment integrations (Coming Soon)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── login/             # Authentication pages
│   ├── signup/
│   └── platform/          # Main platform
│       ├── customer-risk/ # Risk prevention services
│       ├── business-risk/
│       ├── lending-risk/
│       ├── insights/      # Dashboard sections
│       ├── transactions/
│       ├── logs/
│       ├── reports/
│       ├── ai-support/    # Additional services
│       ├── documentation/
│       ├── marketplace/
│       └── settings/
├── styles/               # Global styles
└── public/              # Static assets
```

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with custom QuarkFin branding
- **Icons**: Lucide React
- **Authentication**: Supabase (integration ready)
- **Backend**: Go API (separate service)

## Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=https://quarkfin-platform-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Brand Colors

- Primary Blue: `#3A50D9`
- Light Blue: `#A9C1FF`
- Dark Purple: `#2C2F8F`
- Charcoal Grey: `#2D2D2D`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## License

Copyright © 2025 QuarkFin. All rights reserved.
