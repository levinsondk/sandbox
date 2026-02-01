# Project Notes

> Keep this file under 100 lines. Update when making significant changes.

## Runtime

This project uses **bun** as the runtime.

## Commands

```bash
bun run dev    # Start development server
bun run build  # Production build
```

## Architecture

Next.js 16 app with Tailwind CSS v4 and Framer Motion.

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── arc/                # Arc demo
│   ├── dd/                 # Drag & drop demos
│   │   └── rubber-banding/
│   ├── drag-motion/        # Drag motion demo
│   ├── dumbify-md/         # Markdown tool
│   ├── hello/              # Hello page
│   ├── list-style/         # List styling demo
│   ├── outline-border/     # Border demo
│   ├── randomized-svg/     # SVG generation
│   ├── resize-animation/   # Resize animations
│   ├── rubber-banding/     # Rubber banding demo
│   ├── shader/             # WebGL shaders
│   └── splash/             # Splash page
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── gesture.tsx         # Gesture component
│   └── agentation-provider.tsx
└── lib/
    └── utils.ts            # Utility functions
```

### Key Dependencies

- **next**: App framework
- **framer-motion/motion**: Animations
- **@radix-ui/\***: UI primitives (via shadcn)
- **agentation**: Agent library
- **jszip**: ZIP file handling (shader export)

### Path Aliases

- `@/*` maps to `./src/*` (configured in tsconfig.json)
