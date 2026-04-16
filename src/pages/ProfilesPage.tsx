import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData, DEFAULT_PROFILE_SENTINEL } from '@/contexts/DataContext';
import { PROFILE_TYPES } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Users } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ProfilesPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { profiles, transactions, addProfile, deleteProfile } = useData();
  const visibleProfiles = useMemo(
    () => profiles.filter(p => p.name !== DEFAULT_PROFILE_SENTINEL),
    [profiles]
  );
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'person' | 'business' | 'bank'>('person');
  const [showCannotDelete, setShowCannotDelete] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addProfile({ name: name.trim(), type });
    setName('');
    setType('person');
    setShowForm(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const hasTransactions = transactions.some(tx => tx.profile_id === id);
    if (hasTransactions) {
      setShowCannotDelete(true);
      return;
    }
    deleteProfile(id);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('profiles.title')}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          {t('profiles.add')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 space-y-4">
          <Input
            placeholder={t('profiles.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 bg-secondary border-border/50 rounded-xl"
            autoFocus
          />
          <div className="flex gap-2">
            {PROFILE_TYPES.map(pt => (
              <button
                key={pt.value}
                type="button"
                onClick={() => setType(pt.value)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                  type === pt.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <span>{pt.icon}</span>
                <span>{t(pt.labelKey)}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl text-sm font-medium text-muted-foreground bg-secondary">
              {t('general.cancel')}
            </button>
            <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground active:scale-95 transition-transform">
              {t('profiles.save')}
            </button>
          </div>
        </form>
      )}

      {visibleProfiles.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Users className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-foreground font-medium">{t('profiles.noProfiles')}</p>
          <p className="text-sm text-muted-foreground">{t('profiles.createFirst')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleProfiles.map(profile => (
            <Card
              key={profile.id}
              onClick={() => navigate(`/profiles/${profile.id}`)}
              className="flex items-center gap-3 p-4 rounded-xl bg-card border-border/50 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <span className="text-2xl">{PROFILE_TYPES.find(pt => pt.value === profile.type)?.icon || '👤'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{profile.name}</p>
                <p className="text-xs text-muted-foreground">{t(`profileType.${profile.type}`)}</p>
              </div>
              <button
                onClick={(e) => handleDelete(profile.id, e)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={showCannotDelete} onOpenChange={setShowCannotDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('profiles.cannotDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('profiles.unassignFirst')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowCannotDelete(false)}>
              {t('general.ok')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfilesPage;
