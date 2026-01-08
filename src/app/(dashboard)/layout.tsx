import Link from 'next/link';
import { redirect } from 'next/navigation';
import NextTopLoader from 'nextjs-toploader';
import { getUser } from '@/lib/supabase/server';
import { signOut } from '@/lib/actions/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { NavLinks, MobileNavLinks } from '@/components/nav-links';
import { Button } from '@/components/ui/button';
import { 
  LogOut,
  Sparkles
} from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top Progress Bar */}
      <NextTopLoader
        color="var(--accent)"
        height={3}
        shadow="0 0 10px var(--accent), 0 0 5px var(--accent)"
        showSpinner={false}
        easing="ease"
        speed={200}
      />

      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-[var(--foreground)]">
              Code Recall
            </span>
          </Link>

          {/* Navigation Links */}
          <NavLinks />

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            <div className="hidden h-6 w-px bg-[var(--border)] sm:block" />
            
            <span className="hidden text-sm text-[var(--foreground-muted)] sm:block">
              {displayName}
            </span>
            
            <form action={signOut}>
              <Button 
                type="submit"
                variant="ghost"
                size="sm"
                className="gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--background)] p-2 md:hidden">
        <MobileNavLinks />
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 md:pb-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
