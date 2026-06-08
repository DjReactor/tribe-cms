import { Inter, Merriweather } from 'next/font/google';

export const bodyFont = Inter({ subsets: ['latin'], variable: '--font-body' });
export const headingFont = Merriweather({ subsets: ['latin'], weight: ['300', '400', '700'], variable: '--font-heading' });


export const styles = {
  buttonPrimary: 'bg-[var(--sf-brand)] text-[var(--sf-brand-text)] hover:opacity-90 transition-opacity px-6 py-3 rounded-lg font-medium inline-flex items-center justify-center',
  buttonSecondary: 'bg-[var(--sf-surface)] text-[var(--sf-brand)] border border-[var(--sf-brand)] hover:bg-[var(--sf-surface)] transition-colors px-6 py-3 rounded-lg font-medium inline-flex items-center justify-center',
  headingBase: 'font-heading text-[var(--sf-heading)] tracking-tight',
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
};
