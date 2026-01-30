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
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">
            lvnsn sndbx
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            shitcoding around
          </p>
        </div>

        <nav className="grid gap-4 md:grid-cols-2">
          {pages.map((page) => (
            <Link
              key={page.path}
              href={page.path}
              className="group p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:shadow-lg"
            >
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {page.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {page.description}
              </p>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
