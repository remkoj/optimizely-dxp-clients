import { OptimizelyOneProvider, OptimizelyOneGadget, PageActivator } from '@remkoj/optimizely-one-nextjs/client'

export default function MultiQueryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <OptimizelyOneProvider>
      <PageActivator />
      {children}
      <OptimizelyOneGadget />
    </OptimizelyOneProvider>
  )
}
