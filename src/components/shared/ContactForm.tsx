'use client'

export function ContactForm() {
  return (
    <form className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input type="text" id="firstName" name="firstName" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none transition-all" placeholder="John" />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input type="text" id="lastName" name="lastName" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none transition-all" placeholder="Doe" />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input type="email" id="email" name="email" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none transition-all" placeholder="john@example.com" />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input type="tel" id="phone" name="phone" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none transition-all" placeholder="(555) 123-4567" />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">How can we help you?</label>
        <textarea id="message" name="message" rows={4} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none transition-all" placeholder="Tell us about your project..."></textarea>
      </div>
      <button type="submit" className="w-full py-4 bg-[var(--color-accent)] text-white font-bold rounded-lg hover:opacity-90 transition-opacity">
        Send Message
      </button>
    </form>
  )
}
