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
  'nav.profiles': { es: 'Perfiles', en: 'Profiles' },
  'nav.settings': { es: 'Ajustes', en: 'Settings' },
  // Dashboard
  'dashboard.income': { es: 'Ingresos', en: 'Income' },
  'dashboard.expenses': { es: 'Gastos', en: 'Expenses' },
  'dashboard.balance': { es: 'Balance', en: 'Balance' },
  'dashboard.thisMonth': { es: 'Este mes', en: 'This month' },
  'dashboard.recentTransactions': { es: 'Movimientos recientes', en: 'Recent transactions' },
  'dashboard.hello': { es: 'Hola', en: 'Hello' },
  'dashboard.overview': { es: 'Resumen', en: 'Overview' },
  'dashboard.incomeByProfile': { es: 'Ingresos por perfil', en: 'Income by profile' },
  'dashboard.expenseByProfile': { es: 'Gastos por perfil', en: 'Expenses by profile' },
  'dashboard.balanceOverTime': { es: 'Balance en el tiempo', en: 'Balance over time' },
  'dashboard.filters': { es: 'Filtros', en: 'Filters' },
  'dashboard.allAccounts': { es: 'Todas las cuentas', en: 'All accounts' },
  'dashboard.allProfiles': { es: 'Todos los perfiles', en: 'All profiles' },
  'dashboard.noProfile': { es: 'Sin perfil', en: 'No profile' },
  'dashboard.from': { es: 'Desde', en: 'From' },
  'dashboard.to': { es: 'Hasta', en: 'To' },
  'dashboard.history': { es: 'Historial', en: 'History' },
  'dashboard.tapToSee': { es: 'Toca para ver detalle', en: 'Tap to see details' },
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
  'transactions.transfer': { es: 'Transferencia', en: 'Transfer' },
  'transactions.transferHint': { es: 'Solo entre cuentas propias', en: 'Only between own accounts' },
  'transactions.sourceAccount': { es: 'Cuenta origen', en: 'Source account' },
  'transactions.destinationAccount': { es: 'Cuenta destino', en: 'Destination account' },
  'transactions.needTwoAccounts': { es: 'Necesitas al menos dos cuentas para transferir', en: 'You need at least two accounts to transfer' },
  'transactions.save': { es: 'Guardar', en: 'Save' },
  'transactions.noTransactions': { es: 'No hay movimientos aún', en: 'No transactions yet' },
  'transactions.addFirst': { es: 'Agrega tu primer movimiento', en: 'Add your first transaction' },
  'transactions.profile': { es: 'Perfil', en: 'Profile' },
  'transactions.update': { es: 'Actualizar', en: 'Update' },
  'transactions.edited': { es: 'Editado', en: 'Edited' },
  'transactions.history': { es: 'Historial de cambios', en: 'Change history' },
  'transactions.editedAt': { es: 'Editado el', en: 'Edited at' },
  'transactions.oldValue': { es: 'Valor anterior', en: 'Old value' },
  'transactions.newValue': { es: 'Nuevo valor', en: 'New value' },
  'transactions.chargeToCard': { es: 'Cargar a tarjeta', en: 'Charge to card' },
  'transactions.cardPayment': { es: 'Pago de tarjeta', en: 'Card payment' },
  'transactions.selectCreditAccount': { es: 'Seleccionar tarjeta/crédito', en: 'Select credit account' },
  'transactions.payToCard': { es: 'Aplicar pago a tarjeta', en: 'Apply payment to card' },
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
  'accounts.delete': { es: 'Eliminar cuenta', en: 'Delete account' },
  'accounts.confirmDelete': { es: 'Toca de nuevo para confirmar', en: 'Tap again to confirm' },
  // Account types
  'accountType.cash': { es: 'Efectivo', en: 'Cash' },
  'accountType.bank': { es: 'Banco', en: 'Bank' },
  'accountType.savings': { es: 'Ahorros', en: 'Savings' },
  'accountType.other': { es: 'Otro', en: 'Other' },
  // Profile types
  'profileType.person': { es: 'Persona', en: 'Person' },
  'profileType.business': { es: 'Empresa', en: 'Business' },
  'profileType.bank': { es: 'Banco', en: 'Bank' },
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
  'profiles.income': { es: 'Ingresos', en: 'Income' },
  'profiles.expenses': { es: 'Gastos', en: 'Expenses' },
  'profiles.movements': { es: 'Movimientos', en: 'Movements' },
  'profiles.cannotDelete': { es: 'No se puede eliminar', en: 'Cannot delete' },
  'profiles.unassignFirst': { es: 'No se puede borrar un perfil con movimientos asignados. Desasigna sus movimientos primero.', en: 'Cannot delete a profile with assigned transactions. Unassign its transactions first.' },
  // Credit accounts
  'credit.title': { es: 'Tarjetas de crédito y préstamos', en: 'Credit cards & loans' },
  'credit.add': { es: 'Nuevo crédito', en: 'New credit' },
  'credit.type': { es: 'Tipo de crédito', en: 'Credit type' },
  'credit.creditCard': { es: 'Tarjeta de crédito', en: 'Credit card' },
  'credit.mortgage': { es: 'Hipoteca', en: 'Mortgage' },
  'credit.auto': { es: 'Automotriz', en: 'Auto' },
  'credit.personal': { es: 'Personal', en: 'Personal' },
  'credit.creditLimit': { es: 'Línea de crédito', en: 'Credit limit' },
  'credit.loanAmount': { es: 'Cantidad del préstamo', en: 'Loan amount' },
  'credit.nextPayment': { es: 'Próxima fecha de pago', en: 'Next payment date' },
  'credit.cutOffDate': { es: 'Fecha de corte', en: 'Cut-off date' },
  'credit.paymentDueDate': { es: 'Fecha límite de pago', en: 'Payment due date' },
  'credit.minSpend': { es: 'Gasto mínimo por mes', en: 'Minimum monthly spend' },
  'credit.availableCredit': { es: 'Crédito disponible', en: 'Available credit' },
  'credit.totalSpent': { es: 'Gasto total', en: 'Total spent' },
  'credit.minSpendProgress': { es: 'Progreso de gasto mínimo', en: 'Min. spend progress' },
  'credit.noCreditAccounts': { es: 'No tienes créditos', en: 'No credit accounts yet' },
  'credit.createFirst': { es: 'Agrega tu primera tarjeta o préstamo', en: 'Add your first card or loan' },
  'credit.save': { es: 'Crear crédito', en: 'Create credit' },
  'credit.name': { es: 'Nombre', en: 'Name' },
  'credit.transactions': { es: 'Movimientos del crédito', en: 'Credit transactions' },
  'credit.startDate': { es: 'Fecha del préstamo', en: 'Loan start date' },
  'credit.borrowed': { es: 'Cantidad prestada', en: 'Borrowed amount' },
  'credit.paid': { es: 'Pagado', en: 'Paid' },
  'credit.remaining': { es: 'Restante', en: 'Remaining' },
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
  'general.back': { es: 'Volver', en: 'Back' },
  'general.ok': { es: 'Entendido', en: 'OK' },
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
