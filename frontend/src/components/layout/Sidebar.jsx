import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, ClipboardList, MapPin, Shield, BarChart3,
  Settings, ChevronDown, CreditCard, Calculator, CheckCircle, Database,
  Building2, UserCog, X, Activity, ShieldAlert
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const menuItems = [
  { section: null, items: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN','DIREKSI','KABID','ANALIS','AO','SPI'] },
  ]},
  { section: 'KREDIT', items: [
    { path: '/debitur', label: 'Data Debitur', icon: Users, roles: ['ADMIN','AO','ANALIS','KABID','DIREKSI','SPI'] },
    { path: '/pengajuan', label: 'Pengajuan Kredit', icon: FileText, roles: ['ADMIN','AO','ANALIS','KABID','DIREKSI','SPI'] },
    { path: '/survey', label: 'Survey AO', icon: MapPin, roles: ['ADMIN','AO'] },
    { path: '/agunan', label: 'Agunan', icon: Building2, roles: ['ADMIN','AO','ANALIS','KABID','SPI'] },
    { path: '/slik', label: 'SLIK', icon: Shield, roles: ['ADMIN','ANALIS'] },
    { path: '/monitoring', label: 'Monitoring Kredit', icon: Activity, roles: ['ADMIN','AO','ANALIS','KABID','DIREKSI','SPI'] },
    { path: '/ews', label: 'Early Warning (EWS)', icon: ShieldAlert, roles: ['ADMIN','AO','ANALIS','KABID','DIREKSI','SPI'] },
  ]},
  { section: 'ANALISA', items: [
    { path: '/analisa/konsumtif', label: 'Analisa Konsumtif', icon: Calculator, roles: ['ADMIN','ANALIS','KABID','DIREKSI','SPI'] },
    { path: '/analisa/produktif', label: 'Analisa Produktif', icon: CreditCard, roles: ['ADMIN','ANALIS','KABID','DIREKSI','SPI'] },
    { path: '/scoring', label: 'Credit Scoring', icon: BarChart3, roles: ['ADMIN','ANALIS','KABID','DIREKSI','SPI'] },
  ]},
  { section: 'APPROVAL', items: [
    { path: '/approval', label: 'Workflow Approval', icon: CheckCircle, roles: ['ADMIN','KABID','DIREKSI','SPI'] },
  ]},
  { section: 'ADMIN', items: [
    { path: '/admin/users', label: 'User Management', icon: UserCog, roles: ['ADMIN'] },
    { path: '/admin/master', label: 'Master Data', icon: Database, roles: ['ADMIN'] },
    { path: '/audit', label: 'Audit Trail', icon: ClipboardList, roles: ['SPI','ADMIN','DIREKSI'] },
  ]},
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-navy-light border-r border-navy-border z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-navy-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-navy" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">BPR BAPERA</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wider">ANALISA KREDIT</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100vh-80px)]">
          {menuItems.map((group, gi) => {
            const visibleItems = group.items.filter(item => item.roles.includes(user?.role));
            if (visibleItems.length === 0) return null;
            return (
              <div key={gi} className={gi > 0 ? 'pt-4' : ''}>
                {group.section && (
                  <p className="px-4 mb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    {group.section}
                  </p>
                )}
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
