import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hello World | lvnsn sndbx",
  description: "A simple test page",
};

export default function HelloWorld() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white animate-fade-in">
          Hello World!
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Welcome to your test page
        </p>
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This is a simple test page created with Next.js
          </p>
        </div>
      </div>
    </div>
  );
}
