import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { usePatients } from '@/hooks/use-patients';
import { useAppointmentRequests } from '@/hooks/use-requests';
import {
  Activity, Users, Calendar, FileText, LogOut,
  Sun, Moon, Menu, UserCircle, X, Bell,
  ShieldCheck, BarChart2, Pill, Inbox, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Badge } from './ui';
import { motion, AnimatePresence } from 'framer-motion';
import i18n from '@/lib/i18n';

const LANGUAGES = [
  { code: 'en', label: 'EN', dir: 'ltr' },
  { code: 'fr', label: 'FR', dir: 'ltr' },
  { code: 'ar', label: 'AR', dir: 'rtl' },
];

function getBreadcrumbTitle(location: string, t: (key: string) => string) {
  if (location === '/' || location === '/dashboard') return t('nav.dashboard');
  if (location === '/patients') return t('nav.patients');
  if (/^\/patients\/[^/]+\/blood-tests$/.test(location)) return t('breadcrumb.bloodTests');
  if (/^\/patients\/[^/]+$/.test(location)) return t('breadcrumb.patientRecord');
  if (location === '/requests') return t('nav.onlineRequests');
  if (location === '/appointments') return t('nav.appointments');
  if (location === '/records') return t('nav.medicalRecords');
  if (location === '/prescriptions') return t('nav.prescriptions');
  if (location === '/analytics') return t('nav.analytics');
  if (location === '/admin') return t('nav.adminPanel');
  if (location === '/profile') return t('nav.profile');

  return location
    .split('/')
    .filter(Boolean)
    .map(part => part.replace(/-/g, ' '))
    .join(' / ') || t('nav.dashboard');
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const [location] = useLocation();
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [currentLang, setCurrentLang] = useState(localStorage.getItem('language') || 'en');
  const { data: patients } = usePatients();
  const { data: appointmentRequests } = useAppointmentRequests();

  const NAV_ITEMS = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: Activity },
    { name: t('nav.onlineRequests'), href: '/requests', icon: Inbox },
    { name: t('nav.patients'), href: '/patients', icon: Users },
    { name: t('nav.appointments'), href: '/appointments', icon: Calendar },
    { name: t('nav.medicalRecords'), href: '/records', icon: FileText },
    { name: t('nav.prescriptions'), href: '/prescriptions', icon: Pill },
    { name: t('nav.analytics'), href: '/analytics', icon: BarChart2 },
  ];

  const ADMIN_ITEMS = [
    { name: t('nav.adminPanel'), href: '/admin', icon: ShieldCheck },
  ];

  useEffect(() => {
    const root = window.document.documentElement;
    isDark ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const switchLanguage = (code: string) => {
    const lang = LANGUAGES.find(l => l.code === code);
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
    setCurrentLang(code);
    // Set document direction for Arabic RTL support
    document.documentElement.dir = lang?.dir || 'ltr';
    document.documentElement.lang = code;
    setShowLangMenu(false);
  };

  // Apply direction on mount
  useEffect(() => {
    const lang = LANGUAGES.find(l => l.code === currentLang);
    document.documentElement.dir = lang?.dir || 'ltr';
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  const initials = profile?.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const criticalPatients = (patients || []).filter(p => (p as any).is_critical);

  const isActive = (href: string) =>
    location === href || (href !== '/' && location.startsWith(href));

  const breadcrumbTitle = getBreadcrumbTitle(location, t);

  const NavLink = ({ item }: { item: typeof NAV_ITEMS[0] }) => {
    const active = isActive(item.href);
    return (
      <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
        <div className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer",
          active
            ? "bg-accent text-accent-foreground font-semibold"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground font-medium"
        )}>
          <item.icon className={cn("h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110", active ? "text-accent-foreground" : "text-sidebar-foreground/50 group-hover:text-accent")} style={{ width: '1.1rem', height: '1.1rem' }} />
          <span className="text-sm">{item.name}</span>
          {active && <motion.div layoutId="nav-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-foreground/60" />}
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 w-60 flex flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border/50">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-accent" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent border-2 border-sidebar" />
          </div>
          <div>
            <h1 className="font-display font-bold text-sm text-sidebar-foreground leading-none">CardioDash</h1>
            <p className="text-[10px] text-sidebar-foreground/40 mt-0.5 font-medium tracking-wide uppercase">{t('layout.medicalSystem')}</p>
          </div>
          <button className="ml-auto md:hidden text-sidebar-foreground/40" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] text-sidebar-foreground/30 font-semibold uppercase tracking-widest px-4 mb-2">{t('nav.mainMenu')}</p>
          {NAV_ITEMS.map(item => <NavLink key={item.href} item={item} />)}

          {profile?.role === 'admin' && (
            <>
              <div className="my-3 border-t border-sidebar-border/40" />
              <p className="text-[10px] text-sidebar-foreground/30 font-semibold uppercase tracking-widest px-4 mb-2">{t('nav.administration')}</p>
              {ADMIN_ITEMS.map(item => <NavLink key={item.href} item={item} />)}
            </>
          )}
        </div>

        {/* User Profile */}
        <div className="p-3 border-t border-sidebar-border/50">
          <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
            <div className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group",
              isActive('/profile') ? "bg-accent/20" : "hover:bg-sidebar-accent"
            )}>
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden shrink-0">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-xs font-bold text-accent">{initials}</span>
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-sidebar-foreground truncate">{profile?.full_name || 'User'}</p>
                <p className="text-[10px] text-sidebar-foreground/40 capitalize">{profile?.role}</p>
              </div>
              <UserCircle className="h-3.5 w-3.5 text-sidebar-foreground/30 group-hover:text-accent shrink-0" />
            </div>
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 py-3 bg-card/90 backdrop-blur-md border-b border-border/50 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-xl hover:bg-secondary" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            {/* Breadcrumb-style title */}
            <div className="hidden md:block">
              <p className="text-xs text-muted-foreground font-medium">
                CardioDash / <span className="text-foreground font-semibold">{breadcrumbTitle}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setShowLangMenu(!showLangMenu); setShowNotifications(false); }}
                className="relative"
                title={t('language.label')}
              >
                <Globe style={{ width: '1rem', height: '1rem' }} />
                <span className="absolute -bottom-0.5 -right-0.5 text-[9px] font-bold bg-accent text-accent-foreground rounded px-0.5 leading-tight">
                  {currentLang.toUpperCase()}
                </span>
              </Button>
              <AnimatePresence>
                {showLangMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-12 w-32 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => switchLanguage(lang.code)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary",
                          currentLang === lang.code ? "text-accent font-bold bg-accent/10" : "text-foreground"
                        )}
                      >
                        <span className="text-xs font-bold w-6">{lang.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {lang.code === 'en' ? 'English' : lang.code === 'fr' ? 'Français' : 'العربية'}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setShowNotifications(!showNotifications); setShowLangMenu(false); }}
                className="relative"
              >
                <Bell className="h-4.5 w-4.5" style={{ width: '1.1rem', height: '1.1rem' }} />
                {(criticalPatients.length > 0 || (appointmentRequests?.filter(r => r.status === 'pending' || r.status === 'suggested').length || 0) > 0) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
                )}
              </Button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-12 w-72 bg-card border border-border rounded-2xl shadow-xl z-50 flex flex-col max-h-[80vh]"
                  >
                    <div className="p-3 border-b border-border shrink-0">
                      <p className="text-sm font-bold">{t('layout.notifications')}</p>
                    </div>
                    <div className="overflow-y-auto">
                      {criticalPatients.length === 0 && (appointmentRequests?.filter(r => r.status === 'pending' || r.status === 'suggested').length || 0) === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">{t('layout.allClear')}</div>
                      ) : (
                        <>
                          {appointmentRequests?.filter(r => r.status === 'pending' || r.status === 'suggested').map(r => (
                            <Link href="/requests" key={r.id}>
                              <div className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 cursor-pointer border-b border-border/50">
                                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                <div>
                                  <p className="text-sm font-semibold text-amber-500">Demande: {r.full_name}</p>
                                  <p className="text-xs text-muted-foreground">{t('layout.newRequest')}</p>
                                </div>
                              </div>
                            </Link>
                          ))}
                          {criticalPatients.map(p => (
                            <Link href={`/patients/${p.id}`} key={p.id}>
                              <div className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 cursor-pointer">
                                <div className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                                <div>
                                  <p className="text-sm font-semibold text-destructive">{p.full_name}</p>
                                  <p className="text-xs text-muted-foreground">{t('layout.criticalPatient')}</p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dark mode */}
            <Button variant="ghost" size="icon" onClick={() => setIsDark(!isDark)}>
              {isDark ? <Sun style={{ width: '1rem', height: '1rem' }} /> : <Moon style={{ width: '1rem', height: '1rem' }} />}
            </Button>

            {/* Sign out */}
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title={t('layout.signOut')}
            >
              <LogOut style={{ width: '1rem', height: '1rem' }} />
            </Button>

            {/* Avatar */}
            <Link href="/profile">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-transparent hover:border-accent transition-all">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-xs font-bold text-primary">{initials}</span>
                }
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6" onClick={() => { showNotifications && setShowNotifications(false); showLangMenu && setShowLangMenu(false); }}>
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
