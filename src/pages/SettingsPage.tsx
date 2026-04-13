import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Globe } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { signOut } = useAuth();

  return (
    <div className="space-y-4 pb-24">
      <h1 className="text-2xl font-semibold text-foreground tracking-tight">{t('settings.title')}</h1>

      <div className="glass rounded-2xl divide-y divide-border">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-foreground">{t('settings.language')}</span>
          </div>
          <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
            {(['es', 'en'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  language === lang ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                {lang === 'es' ? 'ES' : 'EN'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={signOut}
        className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-destructive"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-medium">{t('settings.logout')}</span>
      </button>
    </div>
  );
};

export default SettingsPage;
