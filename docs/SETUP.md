# Setup Guide

This guide will walk you through setting up the Liminal Backrooms project for development.

## Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Git
- A code editor (VS Code recommended)
- API keys for:
  - Anthropic (Claude)
  - OpenRouter
  - Replicate

## Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd my-backrooms-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the project root:

```env
# AI Service API Keys
ANTHROPIC_API_KEY=your_anthropic_key
OPENROUTER_API_KEY=your_openrouter_key
REPLICATE_API_TOKEN=your_replicate_token

# Optional Configuration
NEXT_PUBLIC_MAX_TOKENS=1000
NEXT_PUBLIC_TEMPERATURE=0.7
NEXT_PUBLIC_DEFAULT_MODEL=claude-3
```

### 4. Development Server

Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Configuration

### TypeScript Configuration

The `tsconfig.json` is pre-configured, but you can adjust:

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### ESLint Configuration

ESLint is configured for Next.js and TypeScript. Customize in `eslint.config.mjs`:

```javascript
{
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended'
  ]
}
```

### Tailwind CSS Configuration

Tailwind is pre-configured in `tailwind.config.ts`. Customize as needed:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Add custom theme extensions here
    },
  },
  plugins: [],
}

export default config
```

## IDE Setup

### VS Code

1. Install recommended extensions:
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - TypeScript and JavaScript Language Features

2. Configure VS Code settings:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Testing Setup

1. Install testing dependencies:

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

2. Configure Jest in `jest.config.js`:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
```

## API Keys Setup

### Anthropic (Claude)

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account and generate an API key
3. Add to `.env.local` as `ANTHROPIC_API_KEY`

### OpenRouter

1. Visit [OpenRouter](https://openrouter.ai/)
2. Create an account and get API key
3. Add to `.env.local` as `OPENROUTER_API_KEY`

### Replicate

1. Visit [Replicate](https://replicate.com/)
2. Create an account and get API token
3. Add to `.env.local` as `REPLICATE_API_TOKEN`

## Folder Structure Setup

Ensure your project structure matches:

```
my-backrooms-app/
├── app/
│   ├── api/
│   ├── components/
│   └── features/
├── docs/
├── lib/
├── public/
└── [config files]
```

Create any missing directories:

```bash
mkdir -p app/{api,components,features} lib/{ai,types,utils}
```

## Troubleshooting

### Common Issues

1. **Node Version Mismatch**
   ```bash
   nvm use 18
   ```

2. **Missing Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables Not Loading**
   - Ensure `.env.local` is in project root
   - Restart development server

4. **Type Errors**
   ```bash
   npm run type-check
   ```

### Getting Help

- Check [GitHub Issues](https://github.com/your-repo/issues)
- Join our Discord community
- Review the troubleshooting guide

## Next Steps

1. Review the [Architecture Documentation](ARCHITECTURE.md)
2. Explore the [Component Guide](components/COMPONENT_GUIDE.md)
3. Read the [AI Integration Guide](api/AI_INTEGRATION.md)

## Development Workflow

1. Create a new branch for features:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make changes and test:
   ```bash
   npm run test
   npm run lint
   ```

3. Commit changes:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

4. Push and create PR:
   ```bash
   git push origin feature/your-feature-name
   ```

## Deployment Setup

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Link to Vercel:
   ```bash
   vercel link
   ```

3. Add environment variables:
   ```bash
   vercel env add
   ```

4. Deploy:
   ```bash
   vercel deploy
   ``` 