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
    fullName: 'Nom complet', email: 'Email', phone: 'Téléphone', location: 'Localisation',
    linkedin: 'LinkedIn', age: 'Âge', saveChanges: 'Enregistrer',
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
    fullName: 'الاسم الكامل', email: 'البريد الإلكتروني', phone: 'الهاتف', location: 'الموقع',
    linkedin: 'لينكد إن', age: 'العمر', saveChanges: 'حفظ التغييرات',
    moreInfo: 'معلومات إضافية', changePassword: 'تغيير كلمة المرور',
    currentPassword: 'كلمة المرور الحالية', newPassword: 'كلمة المرور الجديدة',
    memberSince: 'عضو منذ', save: 'حفظ', cancel: 'إلغاء',
    edit: 'تعديل', delete: 'حذف', loading: 'جاري التحميل...',
    preferences: 'التفضيلات', account: 'الحساب',
  },
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const [dark, setDark] = useState(() => localStorage.getItem('dark') === 'true');

  useEffect(() => {
    const beat = async () => {
      if (!localStorage.getItem('token')) return;
      try { await api.put('/auth/heartbeat'); } catch {}
    };
    const delay = setTimeout(() => {
      beat();
      const id = setInterval(beat, 30000);
      return () => clearInterval(id);
    }, 5000);
    return () => clearTimeout(delay);
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
