import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Home, ArrowLeftRight, Users, CreditCard, Settings } from 'lucide-react';

const BottomNav: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: '/', icon: Home, label: t('nav.dashboard') },
    { path: '/transactions', icon: ArrowLeftRight, label: t('nav.transactions') },
    { path: '/profiles', icon: Users, label: t('nav.profiles') },
    { path: '/accounts', icon: CreditCard, label: t('nav.accounts') },
    { path: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(tab => {
          const active = tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 pt-3 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
