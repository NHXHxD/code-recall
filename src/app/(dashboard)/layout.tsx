import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';
import { signOut } from '@/lib/actions/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 z-50">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white">Code Recall</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link 
              href="/dashboard" 
              className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link 
              href="/problems" 
              className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              Problems
            </Link>
            <Link 
              href="/review" 
              className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              Review
            </Link>
            <Link 
              href="/problems/new" 
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Add Problem
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              {user.user_metadata?.full_name || user.user_metadata?.name || user.email}
            </span>
            <form action={signOut}>
              <button 
                type="submit"
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

