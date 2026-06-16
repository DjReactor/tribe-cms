import type { Metadata } from "next";
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <h2 className="text-4xl font-bold mb-4">404 - Not Found</h2>
      <p className="mb-8 text-gray-600">The page you are looking for does not exist.</p>
      <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded">
        Return Home
      </Link>
    </div>
  );
}
