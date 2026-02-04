import { Link, useLocation } from '@tanstack/react-router'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { Twitter, FileText, Clock, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: FileText },
  { to: '/drafts/new', label: 'Novo Draft', icon: PlusCircle },
  { to: '/drafts/history', label: 'Histórico', icon: Clock },
]

export default function AppHeader() {
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-5xl mx-auto items-center px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mr-8">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#1DA1F2]/10">
            <Twitter className="h-5 w-5 text-[#1DA1F2]" />
          </div>
          <span className="font-bold text-lg hidden sm:inline-block">
            Xpecialist Control
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#1DA1F2]/10 text-[#1DA1F2]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8',
                },
              }}
            />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white text-sm font-medium rounded-lg transition-colors">
                Entrar
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  )
}
