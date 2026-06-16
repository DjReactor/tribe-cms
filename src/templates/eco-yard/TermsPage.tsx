import Link from 'next/link'
import type { StandardPageProps } from '@/types/template'

export function TermsPage({
  businessInfo,
  resolvedCopy,
  config
}: StandardPageProps) {

  return (
    <div className="w-full bg-[var(--tribe-surface)] pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="flex items-center text-sm font-medium text-gray-500 mb-6">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Terms of Service</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6">
            Terms of Service
          </h1>
          <p className="text-gray-500">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <div className="prose prose-lg prose-gray max-w-none text-gray-600">
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">1. Agreement to Terms</h2>
          <p>
            By accessing our website and utilizing our services, you agree to be bound by these Terms of Service. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">2. Services</h2>
          <p>
            {businessInfo.name} provides professional landscaping, outdoor maintenance, and related services. Specific project terms, deliverables, and timelines will be agreed upon separately in a formal proposal or contract.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">3. User Responsibilities</h2>
          <p>
            Clients are responsible for ensuring that all necessary permissions, property boundaries, and utility markings are clearly defined before the commencement of any landscaping project.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">4. Intellectual Property</h2>
          <p>
            The materials contained in this website, including texts, images, and designs, are protected by applicable copyright and trademark law. You may not modify, copy, reproduce, or distribute any materials without our written consent.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">5. Limitations of Liability</h2>
          <p>
            In no event shall {businessInfo.name} or its suppliers be liable for any damages arising out of the use or inability to use the materials on our website or the execution of our services, beyond the scope outlined in specific project contracts.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">6. Modifications</h2>
          <p>
            We may revise these Terms of Service for our website at any time without notice. By using this website you are agreeing to be bound by the then current version of these Terms of Service.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">7. Contact Information</h2>
          <p>
            If you have any inquiries regarding these terms, please contact us:
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
