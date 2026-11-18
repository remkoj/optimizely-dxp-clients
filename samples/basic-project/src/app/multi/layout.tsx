import { OptimizelyOne } from '@remkoj/optimizely-one-nextjs/server'

export default function MultiQueryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <OptimizelyOne enableGadget={true}>{children}</OptimizelyOne>
  )
}
