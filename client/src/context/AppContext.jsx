import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const translations = {
  en: {
    dashboard: 'Dashboard', resumeBuilder: 'Resume Builder', jobTracker: 'Job Tracker',
    profile: 'Profile', settings: 'Settings', logout: 'Logout',
    language: 'Language', theme: 'Theme', darkMode: 'Dark Mode', lightMode: 'Light Mode',
    fullName: 'Full Name', email: 'Email', phone: 'Phone', location: 'Location',
    linkedin: 'LinkedIn', age: 'Age', saveChanges: 'Save Changes',
    moreInfo: 'More Information', changePassword: 'Change Password',
    currentPassword: 'Current Password', newPassword: 'New Password',
    memberSince: 'Member since', save: 'Save', cancel: 'Cancel',
    edit: 'Edit', delete: 'Delete', loading: 'Loading...',
    preferences: 'Preferences', account: 'Account',
  },
  fr: {
    dashboard: 'Tableau de bord', resumeBuilder: 'Créateur de CV', jobTracker: 'Suivi des emplois',
    profile: 'Profil', settings: 'Paramètres', logout: 'Déconnexion',
    language: 'Langue', theme: 'Thème', darkMode: 'Mode sombre', lightMode: 'Mode clair',
    fullName: 'Nom complet', email: 'E-mail', phone: 'Téléphone', location: 'Localisation',
    linkedin: 'LinkedIn', age: 'Âge', saveChanges: 'Enregistrer les modifications',
    moreInfo: 'Plus d\'informations', changePassword: 'Changer le mot de passe',
    currentPassword: 'Mot de passe actuel', newPassword: 'Nouveau mot de passe',
    memberSince: 'Membre depuis', save: 'Enregistrer', cancel: 'Annuler',
    edit: 'Modifier', delete: 'Supprimer', loading: 'Chargement...',
    preferences: 'Préférences', account: 'Compte',
  },
  ar: {
    dashboard: 'لوحة التحكم', resumeBuilder: 'منشئ السيرة الذاتية', jobTracker: 'متتبع الوظائف',
    profile: 'الملف الشخصي', settings: 'الإعدادات', logout: 'تسجيل الخروج',
    language: 'اللغة', theme: 'المظهر', darkMode: 'الوضع الليلي', lightMode: 'الوضع النهاري',
    fullName: 'الاسم الكامل', email: 'البريد الإلكتروني', phone: 'رقم الهاتف', location: 'الموقع',
    linkedin: 'لينكد إن', age: 'العمر', saveChanges: 'حفظ التغييرات',
    moreInfo: 'معلومات إضافية', changePassword: 'تغيير كلمة المرور',
    currentPassword: 'كلمة المرور الحالية', newPassword: 'كلمة المرور الجديدة',
    memberSince: 'عضو منذ', save: 'حفظ', cancel: 'إلغاء',
    edit: 'تعديل', delete: 'حذف', loading: 'جاري التحميل...',
    preferences: 'التفضيلات', account: 'الحساب',
  },
  es: {
    dashboard: 'Panel de control', resumeBuilder: 'Creador de currículum', jobTracker: 'Seguimiento de empleos',
    profile: 'Perfil', settings: 'Ajustes', logout: 'Cerrar sesión',
    language: 'Idioma', theme: 'Tema', darkMode: 'Modo oscuro', lightMode: 'Modo claro',
    fullName: 'Nombre completo', email: 'Correo electrónico', phone: 'Teléfono', location: 'Ubicación',
    linkedin: 'LinkedIn', age: 'Edad', saveChanges: 'Guardar cambios',
    moreInfo: 'Más información', changePassword: 'Cambiar contraseña',
    currentPassword: 'Contraseña actual', newPassword: 'Nueva contraseña',
    memberSince: 'Miembro desde', save: 'Guardar', cancel: 'Cancelar',
    edit: 'Editar', delete: 'Eliminar', loading: 'Cargando...',
    preferences: 'Preferencias', account: 'Cuenta',
  },
  de: {
    dashboard: 'Dashboard', resumeBuilder: 'Lebenslauf-Ersteller', jobTracker: 'Job-Tracker',
    profile: 'Profil', settings: 'Einstellungen', logout: 'Abmelden',
    language: 'Sprache', theme: 'Design', darkMode: 'Dunkelmodus', lightMode: 'Hellmodus',
    fullName: 'Vollständiger Name', email: 'E-Mail', phone: 'Telefon', location: 'Standort',
    linkedin: 'LinkedIn', age: 'Alter', saveChanges: 'Änderungen speichern',
    moreInfo: 'Weitere Informationen', changePassword: 'Passwort ändern',
    currentPassword: 'Aktuelles Passwort', newPassword: 'Neues Passwort',
    memberSince: 'Mitglied seit', save: 'Speichern', cancel: 'Abbrechen',
    edit: 'Bearbeiten', delete: 'Löschen', loading: 'Lädt...',
    preferences: 'Einstellungen', account: 'Konto',
  },
  pt: {
    dashboard: 'Painel de controle', resumeBuilder: 'Criador de currículo', jobTracker: 'Rastreador de empregos',
    profile: 'Perfil', settings: 'Configurações', logout: 'Sair',
    language: 'Idioma', theme: 'Tema', darkMode: 'Modo escuro', lightMode: 'Modo claro',
    fullName: 'Nome completo', email: 'E-mail', phone: 'Telefone', location: 'Localização',
    linkedin: 'LinkedIn', age: 'Idade', saveChanges: 'Salvar alterações',
    moreInfo: 'Mais informações', changePassword: 'Alterar senha',
    currentPassword: 'Senha atual', newPassword: 'Nova senha',
    memberSince: 'Membro desde', save: 'Salvar', cancel: 'Cancelar',
    edit: 'Editar', delete: 'Excluir', loading: 'Carregando...',
    preferences: 'Preferências', account: 'Conta',
  },
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const beat = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
      } catch {}
      try { await api.put('/auth/heartbeat'); } catch {}
    };
    let intervalId = null;
    const delay = setTimeout(() => {
      beat();
      intervalId = setInterval(beat, 30000);
    }, 5000);
    return () => {
      clearTimeout(delay);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('dark', String(dark));
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <AppContext.Provider value={{ lang, setLang, dark, setDark, t: translations[lang] }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
