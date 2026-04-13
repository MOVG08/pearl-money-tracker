import React, { createContext, useContext, useState } from 'react';

type Language = 'es' | 'en';

interface Translations {
  [key: string]: { es: string; en: string };
}

const translations: Translations = {
  // Auth
  'auth.login': { es: 'Iniciar sesión', en: 'Log in' },
  'auth.signup': { es: 'Crear cuenta', en: 'Sign up' },
  'auth.email': { es: 'Correo electrónico', en: 'Email' },
  'auth.password': { es: 'Contraseña', en: 'Password' },
  'auth.name': { es: 'Nombre', en: 'Name' },
  'auth.noAccount': { es: '¿No tienes cuenta?', en: "Don't have an account?" },
  'auth.hasAccount': { es: '¿Ya tienes cuenta?', en: 'Already have an account?' },
  // Nav
  'nav.dashboard': { es: 'Inicio', en: 'Home' },
  'nav.transactions': { es: 'Movimientos', en: 'Transactions' },
  'nav.accounts': { es: 'Cuentas', en: 'Accounts' },
  'nav.settings': { es: 'Ajustes', en: 'Settings' },
  // Dashboard
  'dashboard.income': { es: 'Ingresos', en: 'Income' },
  'dashboard.expenses': { es: 'Gastos', en: 'Expenses' },
  'dashboard.balance': { es: 'Balance', en: 'Balance' },
  'dashboard.thisMonth': { es: 'Este mes', en: 'This month' },
  'dashboard.recentTransactions': { es: 'Movimientos recientes', en: 'Recent transactions' },
  'dashboard.overview': { es: 'Resumen', en: 'Overview' },
  // Transactions
  'transactions.title': { es: 'Movimientos', en: 'Transactions' },
  'transactions.add': { es: 'Agregar', en: 'Add' },
  'transactions.amount': { es: 'Monto', en: 'Amount' },
  'transactions.type': { es: 'Tipo', en: 'Type' },
  'transactions.category': { es: 'Categoría', en: 'Category' },
  'transactions.date': { es: 'Fecha', en: 'Date' },
  'transactions.notes': { es: 'Notas', en: 'Notes' },
  'transactions.account': { es: 'Cuenta', en: 'Account' },
  'transactions.income': { es: 'Ingreso', en: 'Income' },
  'transactions.expense': { es: 'Gasto', en: 'Expense' },
  'transactions.save': { es: 'Guardar', en: 'Save' },
  'transactions.noTransactions': { es: 'No hay movimientos aún', en: 'No transactions yet' },
  'transactions.addFirst': { es: 'Agrega tu primer movimiento', en: 'Add your first transaction' },
  'transactions.profile': { es: 'Perfil', en: 'Profile' },
  // Accounts
  'accounts.title': { es: 'Cuentas', en: 'Accounts' },
  'accounts.add': { es: 'Nueva cuenta', en: 'New account' },
  'accounts.name': { es: 'Nombre de la cuenta', en: 'Account name' },
  'accounts.type': { es: 'Tipo de cuenta', en: 'Account type' },
  'accounts.balance': { es: 'Saldo inicial', en: 'Initial balance' },
  'accounts.save': { es: 'Crear cuenta', en: 'Create account' },
  'accounts.noAccounts': { es: 'No tienes cuentas', en: 'No accounts yet' },
  'accounts.createFirst': { es: 'Crea tu primera cuenta para empezar', en: 'Create your first account to get started' },
  'accounts.needAccount': { es: 'Necesitas crear una cuenta primero', en: 'You need to create an account first' },
  // Account types
  'accountType.cash': { es: 'Efectivo', en: 'Cash' },
  'accountType.bank': { es: 'Banco', en: 'Bank' },
  'accountType.credit_card': { es: 'Tarjeta de crédito', en: 'Credit card' },
  'accountType.savings': { es: 'Ahorros', en: 'Savings' },
  'accountType.other': { es: 'Otro', en: 'Other' },
  // Profile types
  'profileType.person': { es: 'Persona', en: 'Person' },
  'profileType.business': { es: 'Empresa', en: 'Business' },
  // Profiles
  'profiles.title': { es: 'Perfiles', en: 'Profiles' },
  'profiles.add': { es: 'Nuevo perfil', en: 'New profile' },
  'profiles.name': { es: 'Nombre del perfil', en: 'Profile name' },
  'profiles.type': { es: 'Tipo de perfil', en: 'Profile type' },
  'profiles.save': { es: 'Crear perfil', en: 'Create profile' },
  'profiles.noProfiles': { es: 'No tienes perfiles', en: 'No profiles yet' },
  'profiles.createFirst': { es: 'Crea un perfil para registrar con quién transaccionas', en: 'Create a profile to track who you transact with' },
  'profiles.needProfile': { es: 'Necesitas crear un perfil primero', en: 'You need to create a profile first' },
  'profiles.search': { es: 'Buscar perfil...', en: 'Search profile...' },
  'profiles.quickCreate': { es: 'Crear nuevo perfil', en: 'Create new profile' },
  // Settings
  'settings.title': { es: 'Ajustes', en: 'Settings' },
  'settings.language': { es: 'Idioma', en: 'Language' },
  'settings.theme': { es: 'Tema', en: 'Theme' },
  'settings.dark': { es: 'Oscuro', en: 'Dark' },
  'settings.light': { es: 'Claro', en: 'Light' },
  'settings.logout': { es: 'Cerrar sesión', en: 'Log out' },
  // General
  'general.cancel': { es: 'Cancelar', en: 'Cancel' },
  'general.delete': { es: 'Eliminar', en: 'Delete' },
  'general.edit': { es: 'Editar', en: 'Edit' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es');

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
