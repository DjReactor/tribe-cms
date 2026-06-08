import { Inter, Roboto_Slab } from 'next/font/google'

export const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const headingFont = Roboto_Slab({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

