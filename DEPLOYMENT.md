# DEPLOYMENT GUIDE

## Overview
This is a Vite + React + TypeScript application for Sri Senthur Furniture Order Management System (OMS).

## Prerequisites
- Node.js 18+ 
- npm 9+
- Git

## Environment Setup

### Local Development
1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your configuration values to `.env`:
```
VITE_GEMINI_API_KEY=your_api_key_here
VITE_APP_ENVIRONMENT=development
VITE_API_BASE_URL=http://localhost:5000
```

3. Install dependencies:
```bash
npm install --legacy-peer-deps
```

4. Run development server:
```bash
npm run dev
```

Server will be available at `http://localhost:3000`

## Building for Production

### Local Build
```bash
npm run build:prod
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build
```bash
npm run preview:prod
```

## Deployment Platforms

### Vercel (Recommended)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" and import this repository
4. Set environment variables in Vercel dashboard:
   - `VITE_GEMINI_API_KEY`
5. Click "Deploy"

Vercel automatically uses `vercel.json` configuration.

### GitHub Pages
```bash
npm run build
# Deploy dist/ folder contents to gh-pages branch
```

### Netlify
1. Connect your GitHub repository
2. Build command: `npm install --legacy-peer-deps && npm run build`
3. Publish directory: `dist`
4. Set environment variables in Netlify dashboard

### Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
```

Build and run:
```bash
docker build -t furniture-oms .
docker run -p 3000:3000 -e VITE_GEMINI_API_KEY=your_key furniture-oms
```

## CI/CD Pipeline

### GitHub Actions
The repository includes automated CI/CD via `.github/workflows/build.yml`:
- Runs on every push to `main` and `develop`
- Runs on pull requests to `main`
- Installs dependencies with `--legacy-peer-deps`
- Builds the application
- Uploads build artifacts

### Configuring Secrets
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `VITE_GEMINI_API_KEY`: Your Gemini API key

## Performance Optimization

The application includes:
- Code splitting for vendor libraries (React, Recharts, Lucide)
- Tree shaking and minification
- Terser compression with console removal in production
- Source maps disabled in production

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_GEMINI_API_KEY` | - | API key for Gemini services |
| `VITE_APP_ENVIRONMENT` | `development` | Application environment |
| `VITE_API_BASE_URL` | `http://localhost:5000` | Backend API URL |

## Monitoring & Logging

For production:
1. Enable error tracking (e.g., Sentry)
2. Monitor build size: `npm run build` logs bundle size
3. Check performance metrics in browser DevTools

## Database & Storage

- **Local Storage**: Orders are stored in browser localStorage
- For production database: Update API endpoint in `.env.production`

## Security Checklist

- [ ] API keys stored in environment variables
- [ ] HTTPS enabled on production domain
- [ ] CORS configured properly
- [ ] Content Security Policy headers set
- [ ] Dependencies kept up-to-date
- [ ] Regular security audits

## Troubleshooting

### Build Fails
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000
```

## Support
For issues, contact the development team or create an issue on GitHub.
