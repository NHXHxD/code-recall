'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FolderOpen, 
  RotateCcw, 
  Plus 
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/problems', label: 'Problems', icon: FolderOpen },
  { href: '/review', label: 'Review', icon: RotateCcw },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="hidden items-center gap-1 md:flex">
      {navItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/dashboard' && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link key={item.href} href={item.href}>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "gap-2 transition-colors",
                isActive 
                  ? "bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/15 hover:text-[var(--accent)]" 
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        );
      })}
      <Link href="/problems/new">
        <Button variant="primary" size="sm" className="ml-2 gap-2">
          <Plus className="h-4 w-4" />
          Add Problem
        </Button>
      </Link>
    </div>
  );
}

export function MobileNavLinks() {
  const pathname = usePathname();

  const mobileItems = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/problems', label: 'Problems', icon: FolderOpen },
    { href: '/review', label: 'Review', icon: RotateCcw },
  ];

  return (
    <div className="flex items-center justify-around">
      {mobileItems.slice(0, 2).map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/dashboard' && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link key={item.href} href={item.href}>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "flex-col gap-1 h-auto py-2 transition-colors",
                isActive 
                  ? "text-[var(--accent)]" 
                  : "text-[var(--foreground-muted)]"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Button>
          </Link>
        );
      })}
      
      {/* Center Add Button */}
      <Link href="/problems/new">
        <Button variant="primary" size="icon" className="h-12 w-12 rounded-full shadow-lg">
          <Plus className="h-6 w-6" />
        </Button>
      </Link>

      {/* Review */}
      {(() => {
        const reviewItem = mobileItems[2];
        const isActive = pathname === reviewItem.href || pathname.startsWith(reviewItem.href);
        const Icon = reviewItem.icon;

        return (
          <Link href={reviewItem.href}>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "flex-col gap-1 h-auto py-2 transition-colors",
                isActive 
                  ? "text-[var(--accent)]" 
                  : "text-[var(--foreground-muted)]"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{reviewItem.label}</span>
            </Button>
          </Link>
        );
      })()}
    </div>
  );
}
