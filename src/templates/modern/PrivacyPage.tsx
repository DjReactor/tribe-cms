import type { StaticPageProps } from '@/types/template';
import { styles } from './theme';

export function PrivacyPage({ businessInfo, pageContent, config }: StaticPageProps) {
  return (
    <div className="py-20 bg-[var(--tribe-surface)] min-h-screen">
      <div className={`${styles.container} max-w-4xl`}>
        <div className="mb-12">
          <h1 className={`${styles.headingBase} text-4xl md:text-5xl font-bold mb-6`}>Privacy Policy</h1>
          <p className="text-[var(--tribe-text-muted)]">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <div 
          className="prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: pageContent }} 
        />
      </div>
    </div>
  );
}
