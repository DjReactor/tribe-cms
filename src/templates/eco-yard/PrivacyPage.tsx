import Link from 'next/link'
import type { StandardPageProps } from '@/types/template'

export function PrivacyPage({
  businessInfo,
  resolvedCopy,
  config
}: StandardPageProps) {

  return (
    <div className="w-full bg-[var(--sf-surface)] pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-6">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Privacy Policy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6">
            Privacy Policy
          </h1>
          <p className="text-gray-500">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
          <p>
            At {businessInfo.name}, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">1. Information We Collect</h2>
          <p>
            We may collect personal information that you voluntarily provide to us when you express an interest in obtaining information about us or our products and services, when you participate in activities on the website, or otherwise when you contact us. This may include:
          </p>
          <ul>
            <li>Name and Contact Data</li>
            <li>Property Address or Location Information</li>
            <li>Billing Information</li>
            <li>Any other details you choose to provide in forms or correspondence</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">2. How We Use Your Information</h2>
          <p>
            We use personal information collected via our website for a variety of business purposes described below:
          </p>
          <ul>
            <li>To facilitate account creation and logon process.</li>
            <li>To send administrative information to you.</li>
            <li>To fulfill and manage your service requests and projects.</li>
            <li>To respond to legal requests and prevent harm.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">3. Disclosure of Your Information</h2>
          <p>
            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We do not sell your personal information to third parties.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">4. Security of Your Information</h2>
          <p>
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">5. Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, please contact us at:
          </p>
          <address className="not-italic mt-4 p-6 bg-gray-50 rounded-xl border border-gray-100">
            <strong>{businessInfo.name}</strong><br />
            {businessInfo.city}, {businessInfo.state}<br />
            Phone: {businessInfo.phone}<br />
            Email: {businessInfo.email}
          </address>
        </div>
      </div>
    </div>
  )
}
