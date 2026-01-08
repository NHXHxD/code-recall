import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';
import { signOut } from '@/lib/actions/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  FolderOpen, 
  RotateCcw, 
  Plus,
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
          <div className="hidden items-center gap-1 md:flex">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/problems">
              <Button variant="ghost" size="sm" className="gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                <FolderOpen className="h-4 w-4" />
                Problems
              </Button>
            </Link>
            <Link href="/review">
              <Button variant="ghost" size="sm" className="gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                <RotateCcw className="h-4 w-4" />
                Review
              </Button>
            </Link>
            <Link href="/problems/new">
              <Button variant="primary" size="sm" className="ml-2 gap-2">
                <Plus className="h-4 w-4" />
                Add Problem
              </Button>
            </Link>
          </div>

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
        <div className="flex items-center justify-around">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2">
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-xs">Home</span>
            </Button>
          </Link>
          <Link href="/problems">
            <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2">
              <FolderOpen className="h-5 w-5" />
              <span className="text-xs">Problems</span>
            </Button>
          </Link>
          <Link href="/problems/new">
            <Button variant="primary" size="icon" className="h-12 w-12 rounded-full shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
          </Link>
          <Link href="/review">
            <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2">
              <RotateCcw className="h-5 w-5" />
              <span className="text-xs">Review</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 md:pb-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
