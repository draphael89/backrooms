# Liminal Backrooms - AI-Powered Interactive Fiction

An immersive, AI-driven interactive fiction experience that creates dynamic, branching narratives in a liminal space setting. Built with Next.js, TypeScript, and multiple AI models.

## Features

- 🤖 Multi-AI Model Integration (Claude, GPT-4, DeepSeek)
- 🌳 Dynamic Conversation Branching
- 📊 Interactive Network Visualization
- 🎨 AI-Generated Imagery
- 💾 Persistent Conversation Memory
- 📱 Responsive Dark-Theme UI

## Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd my-backrooms-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
my-backrooms-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   └── features/          # Feature implementations
├── docs/                  # Documentation
├── public/                # Static assets
└── [other config files]
```

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Setup Guide](docs/SETUP.md)
- [AI Integration](docs/api/AI_INTEGRATION.md)
- [Component Guide](docs/components/COMPONENT_GUIDE.md)
- [Contributing](docs/dev/CONTRIBUTING.md)

## Development

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses:
- [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) with [Geist](https://vercel.com/font)
- Tailwind CSS for styling
- TypeScript for type safety
- ESLint and Prettier for code quality

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub repository](https://github.com/vercel/next.js)

## Deployment

Deploy easily using [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme):

```bash
npm run build
vercel deploy
```

Check out our [deployment documentation](docs/ops/DEPLOYMENT.md) for more details.

## License

[MIT](LICENSE)
# backrooms
