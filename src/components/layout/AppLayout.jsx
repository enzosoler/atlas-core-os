import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import TrialBanner from '@/components/shared/TrialBanner';
import SupportWidget from '@/components/shared/SupportWidget';
import AtlasCoreLogoSVG from '@/components/AtlasCoreLogoSVG';
import {
  Home, UtensilsCrossed, Dumbbell, FlaskConical,
  BarChart3, Brain, User, Menu, X, ChevronLeft,
  Heart, BookOpen, LogOut, ShieldCheck, Users,
  Download, Camera, ClipboardList, ChefHat,
  LayoutDashboard, MessageSquare, TrendingUp,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useRBAC, ROLE_LABELS } from '@/lib/rbac';

const ICON_MAP = {
  Home, UtensilsCrossed, Dumbbell, FlaskConical, BarChart3, Brain, User,
  Heart, BookOpen, ShieldCheck, Users, Download, Camera, ClipboardList,
  ChefHat, LayoutDashboard, MessageSquare, TrendingUp,
};

const BOTTOM_PATHS_BY_ROLE = {
  athlete:      ['/Today', '/Nutrition', '/Workouts', '/AtlasAI'],
  coach:        ['/Today', '/coach-dashboard', '/coach/students', '/Profile'],
  nutritionist: ['/Today', '/nutritionist-dashboard', '/nutritionist/clients', '/Profile'],
  clinician:    ['/Today', '/clinician-dashboard', '/clinician/patients', '/Profile'],
  admin:        ['/Today', '/Pricing', '/Social', '/Profile'],
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { role, nav } = useRBAC(user);

  const bottomPaths = BOTTOM_PATHS_BY_ROLE[role] || BOTTOM_PATHS_BY_ROLE.athlete;
  const bottomNav = nav.filter(n => bottomPaths.includes(n.path));

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = (path) =>
    pathname === path || (path !== '/Today' && pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-white flex">

      {/* ── Desktop sidebar (iOS-style) ── */}
      <aside className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-40
        bg-white border-r border-[#D5D5D7]
        transition-all duration-300 ease-out shrink-0
        ${collapsed ? 'w-16' : 'w-60'}`}>

        <div className={`flex items-center h-14 shrink-0 border-b border-[#D5D5D7] px-4 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <AtlasCoreLogoSVG width={28} height={28} className="shrink-0" />
          {!collapsed && <span className="text-[16px] font-semibold tracking-tight text-[#1D1D1D]">Atlas Core</span>}
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {nav.map(({ path, label, icon }) => {
            const Icon = ICON_MAP[icon] || Home;
            const active = isActive(path);
            return (
              <Link key={path} to={path}
                title={collapsed ? label : undefined}
                className={`flex items-center rounded-[10px] text-[13px] font-medium transition-colors h-10
                  ${collapsed ? 'justify-center w-10 mx-auto' : 'gap-3 px-3'}
                  ${active
                    ? 'bg-[#3B82F6]/10 text-[#3B82F6]'
                    : 'text-[#86868B] hover:text-[#1D1D1D] hover:bg-[#F5F5F7]'}`}>
                <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.5 : 2} />
                {!collapsed && label}
              </Link>
            );
          })}
          {/* Admin Panel - desktop */}
          {role === 'admin' && (
            <Link to="/AdminPanel"
              title={collapsed ? 'Admin Panel' : undefined}
              className={`flex items-center rounded-[10px] text-[13px] font-medium transition-colors h-10
                ${collapsed ? 'justify-center w-10 mx-auto' : 'gap-3 px-3'}
                ${isActive('/AdminPanel')
                  ? 'bg-[#3B82F6]/10 text-[#3B82F6]'
                  : 'text-[#86868B] hover:text-[#1D1D1D] hover:bg-[#F5F5F7]'}`}>
              <ShieldCheck className="w-4 h-4 shrink-0" strokeWidth={2} />
              {!collapsed && 'Admin Panel'}
            </Link>
          )}
        </nav>

        <div className="px-2 py-3 border-t border-[#D5D5D7] space-y-1 shrink-0">
          {!collapsed && (
            <div className="px-3 py-2 mb-1">
              <p className="text-[12px] truncate text-[#1D1D1D] font-medium">{user?.full_name || user?.email}</p>
              <span className="inline-block text-[11px] text-[#86868B] mt-0.5">{ROLE_LABELS[role] || role}</span>
            </div>
          )}
          <button onClick={() => base44.auth.logout('/Landing')}
            className={`flex items-center rounded-[10px] text-[13px] font-medium transition-colors h-10 text-[#86868B] hover:text-[#DC2626] hover:bg-[#DC2626]/10 w-full
              ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}>
            <LogOut className="w-4 h-4 shrink-0" strokeWidth={2} />
            {!collapsed && 'Sair'}
          </button>
          <button onClick={() => setCollapsed(c => !c)}
            className={`flex items-center rounded-[10px] text-[13px] transition-colors h-10 text-[#86868B] hover:text-[#1D1D1D] hover:bg-[#F5F5F7] w-full
              ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}>
            <ChevronLeft className={`w-4 h-4 shrink-0 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} strokeWidth={2} />
            {!collapsed && 'Recolher'}
          </button>
        </div>
      </aside>

      {/* ── Mobile header (iOS-style) ── */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-[60] h-12 bg-white border-b border-[#D5D5D7] flex items-center justify-between px-4"
        style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
        {/* Hamburger LEFT */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="p-1.5 rounded-lg hover:bg-[hsl(var(--shell))] transition-colors"
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mobileOpen ? 'close' : 'open'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {mobileOpen
                ? <X className="w-5 h-5" strokeWidth={2} />
                : <Menu className="w-5 h-5" strokeWidth={2} />}
            </motion.div>
          </AnimatePresence>
        </button>

        {/* Logo CENTER */}
        <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <AtlasCoreLogoSVG width={24} height={24} />
          <span className="text-[16px] font-semibold tracking-tight text-[#1D1D1D]">Atlas Core</span>
        </div>

        {/* Spacer RIGHT to balance */}
        <div className="w-8" />
      </header>

      {/* ── Mobile drawer (left) ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-[65] bg-black/50"
            />
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-[70] w-72 bg-white border-r border-[#D5D5D7] flex flex-col shadow-xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between h-12 px-4 border-b border-[#D5D5D7] shrink-0">
                <div className="flex items-center gap-2">
                  <AtlasCoreLogoSVG width={24} height={24} />
                  <span className="text-[16px] font-semibold tracking-tight text-[#1D1D1D]">Atlas Core</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-[#F5F5F7] transition-colors">
                  <X className="w-4 h-4 text-[#1D1D1D]" strokeWidth={2} />
                </button>
              </div>

              {/* Drawer nav */}
              <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
                {nav.map(({ path, label, icon }) => {
                  const Icon = ICON_MAP[icon] || Home;
                  const active = isActive(path);
                  return (
                    <Link key={path} to={path}
                      className={`flex items-center gap-3 px-3 h-11 rounded-[10px] text-[14px] font-medium transition-colors
                        ${active
                          ? 'bg-[#3B82F6]/10 text-[#3B82F6]'
                          : 'text-[#86868B] hover:text-[#1D1D1D] hover:bg-[#F5F5F7]'}`}>
                      <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={active ? 2.5 : 2} />
                      {label}
                    </Link>
                  );
                })}
                {/* Admin Panel - mobile */}
                {role === 'admin' && (
                  <Link to="/AdminPanel"
                    className={`flex items-center gap-3 px-3 h-11 rounded-[10px] text-[14px] font-medium transition-colors
                      ${isActive('/AdminPanel')
                        ? 'bg-[#3B82F6]/10 text-[#3B82F6]'
                        : 'text-[#86868B] hover:text-[#1D1D1D] hover:bg-[#F5F5F7]'}`}>
                    <ShieldCheck className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
                    Admin Panel
                  </Link>
                )}
              </nav>

              {/* Drawer footer */}
              <div className="px-2 py-3 border-t border-[#D5D5D7] space-y-1 shrink-0">
                <div className="px-3 py-2">
                  <p className="text-[13px] font-medium truncate text-[#1D1D1D]">{user?.full_name || user?.email}</p>
                  <p className="text-[11px] text-[#86868B] truncate">{user?.email}</p>
                  <span className="text-[11px] text-[#86868B] inline-block mt-1">{ROLE_LABELS[role] || role}</span>
                </div>
                <button
                  onClick={() => base44.auth.logout('/Landing')}
                  className="flex items-center gap-3 px-3 h-11 rounded-[10px] text-[14px] font-medium text-[#86868B] hover:text-[#DC2626] hover:bg-[#DC2626]/10 w-full transition-colors"
                >
                  <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={2} /> Sair
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile bottom nav (iOS tab bar style) ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-[60] bg-white border-t border-[#D5D5D7]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-[60px] px-1">
          {bottomNav.map(({ path, label, icon }) => {
            const Icon = ICON_MAP[icon] || Home;
            const active = isActive(path);
            return (
              <Link key={path} to={path}
                className={`flex flex-col items-center gap-[4px] px-2 py-1.5 rounded-lg transition-colors min-w-0 flex-1
                  ${active ? 'text-[#3B82F6]' : 'text-[#86868B]'}`}>
                <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium tracking-tight leading-none truncate max-w-[52px] text-center">{label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center gap-[4px] px-2 py-1.5 rounded-lg transition-colors text-[#86868B] flex-1"
          >
            <Menu className="w-5 h-5 shrink-0" strokeWidth={2} />
            <span className="text-[10px] font-medium tracking-tight leading-none">Menu</span>
          </button>
        </div>
      </nav>

      {/* ── Page content ── */}
      <main className={`flex-1 min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-56'} pt-12 lg:pt-0 pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-0 overflow-x-hidden`}>
        <TrialBanner />
        <Outlet />
        <SupportWidget />
      </main>
    </div>
  );
}