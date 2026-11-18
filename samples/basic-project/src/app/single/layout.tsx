import { OptimizelyOne } from '@remkoj/optimizely-one-nextjs/server'

export default function SingleQueryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <OptimizelyOne>{children}</OptimizelyOne>
  )
}
