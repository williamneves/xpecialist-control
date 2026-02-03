import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import AppHeader from '../components/AppHeader'
import { Toaster } from '@/components/ui/sonner'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import ConvexProvider from '../integrations/convex/provider'

import ClerkProvider from '../integrations/clerk/provider'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Xpecialist Control - Dashboard',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ConvexProvider>
          <ClerkProvider>
            <div className="relative flex min-h-screen flex-col">
              <AppHeader />
              <main className="flex-1">
                {children}
              </main>
              <footer className="border-t border-border/40 py-4">
                <div className="container max-w-screen-2xl px-4 text-center text-sm text-muted-foreground">
                  Xpecialist Control - Gerenciamento de conteúdo para Twitter/X
                </div>
              </footer>
            </div>
            <Toaster richColors position="top-right" />
            <TanStackDevtools
              config={{
                position: 'bottom-right',
              }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
                TanStackQueryDevtools,
              ]}
            />
          </ClerkProvider>
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  )
}
