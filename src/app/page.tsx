import Link from "next/link";

const pages = [
  {
    path: "/shader",
    title: "Shader Playground",
    description: "Apply WebGL shader effects to images",
  },
  {
    path: "/splash",
    title: "Splash Generator",
    description: "Create parametric splash-like star shapes",
  },
  {
    path: "/randomized-svg",
    title: "Randomized SVG Shapes",
    description: "Randomly generated SVG shapes with constrained vertices",
  },
  {
    path: "/arc",
    title: "SVG Arc Visualizer",
    description: "Interactive SVG arc path tool",
  },
  {
    path: "/drag-motion",
    title: "Drag Motion",
    description: "Interactive drag demo with Framer Motion",
  },
  {
    path: "/list-style",
    title: "List Styles",
    description: "List styling and typography examples",
  },
  {
    path: "/dumbify-md",
    title: "Markdown Display",
    description: "Markdown and code block styling",
  },
  {
    path: "/hello",
    title: "Hello World",
    description: "A simple test page",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen p-8 text-base">
      <div className="space-y-6">
        <header>
          <h1 className="font-medium">lvnsn sndbx</h1>
        </header>
        <nav className="space-y-2">
          {pages.map((page) => (
            <div key={page.path}>
              <Link href={page.path}>{page.title}</Link>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
