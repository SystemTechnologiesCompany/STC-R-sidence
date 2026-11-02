import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text as NativeText, TextInput as NativeInput, type TextProps, type TextInputProps } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const arabic: Record<string, string> = {
  'RÉSIDENCE': 'الإقامة', 'ESPACE RÉSIDENT': 'فضاء المقيم', 'Votre résidence,': 'إقامتكم،', 'plus proche.': 'أقرب إليكم.',
  'Un seul endroit pour signaler, suivre et améliorer votre quotidien.': 'مكان واحد للتبليغ والمتابعة وتحسين حياتكم اليومية.',
  'OUARGLA': 'ورقلة', '11 résidences · un lien': '11 إقامة · رابط واحد', 'BIENVENUE SUR STC RÉSIDENCE': 'مرحبًا بكم في STC Résidence',
  'Comment souhaitez-vous continuer ?': 'كيف تودّ المتابعة؟', 'Choisissez votre espace pour accéder aux services de votre résidence.': 'اختر فضاءك للوصول إلى مصالح إقامتك.',
  'Je suis étudiant·e': 'أنا طالب / طالبة', 'Signaler un problème, suivre mes demandes': 'التبليغ عن مشكلة ومتابعة طلباتي', 'Je travaille en résidence': 'أنا موظف في الإقامة',
  'Espace responsable ou gestionnaire': 'فضاء مسؤول المصلحة أو المدير', 'Une résidence mieux écoutée, chaque jour.': 'إقامة تنصت إليكم أكثر، كل يوم.',
  'Connexion': 'تسجيل الدخول', 'Bienvenue dans votre espace': 'مرحبًا بك في فضائك', 'Connectez-vous pour continuer comme': 'سجّل الدخول للمتابعة بصفتك',
  'Étudiant·e': 'طالب / طالبة', 'Gestionnaire': 'مدير الإقامة', 'Responsable de service': 'مسؤول المصلحة', 'Continuer avec Google': 'المتابعة باستخدام Google',
  'Connexion Google': 'تسجيل الدخول عبر Google', 'La connexion Google sera activée après la configuration du projet OAuth STC.': 'سيُفعّل تسجيل الدخول عبر Google بعد إعداد OAuth لمشروع STC.',
  'Accès gestionnaire →': 'دخول المدير ←', 'En continuant, vous acceptez les conditions d’utilisation et la politique de confidentialité de STC Résidence.': 'بالمتابعة، توافق على شروط الاستخدام وسياسة الخصوصية لتطبيق STC Résidence.',
  'Accès équipe': 'دخول الفريق', 'EN ATTENTE DE VALIDATION': 'في انتظار الموافقة', 'Votre demande est envoyée': 'تم إرسال طلبك',
  'Le gestionnaire de la résidence vérifiera votre rôle avant d’ouvrir l’espace équipe.': 'سيتحقق مدير الإقامة من دورك قبل إتاحة فضاء الفريق.',
  'Votre résidence et votre service seront associés à votre compte après validation.': 'سيُربط حسابك بإقامتك ومصلحتك بعد الموافقة.',
  'Simuler l’approbation du gestionnaire': 'محاكاة موافقة المدير', 'Aperçu de démonstration · les validations réelles nécessitent un serveur sécurisé.': 'نسخة تجريبية · الموافقات الفعلية تتطلب خادمًا آمنًا.',
  'Votre résidence': 'إقامتك', 'Où habitez-vous ?': 'في أي إقامة تسكن؟', 'Les résidences sont affichées par DOU. La première est ouverte pour le lancement.': 'الإقامات مرتبة حسب مديرية الخدمات الجامعية. الإقامة الأولى متاحة عند الإطلاق.',
  'DOU OUARGLA': 'مديرية الخدمات الجامعية ورقلة', 'DOU OUARGLA-PÔLE': 'مديرية الخدمات الجامعية ورقلة القطب', 'Résidence garçons · Ouargla': 'إقامة ذكور · ورقلة',
  'Ouverture prochaine': 'متاحة قريبًا', 'Bientôt': 'قريبًا', 'Bientôt disponible': 'متاحة قريبًا', 'Continuer': 'متابعة',
  'Khelafoui El-Hadj': 'خلفاوي الحاج', 'Abou Ammar Abdel Kafi': 'أبو عمار عبد الكافي', 'Salem Ben Younes': 'سالم بن يونس', 'Ben Moussa Mohamed': 'بن موسى محمد',
  'Lakhdari Mohamed Al Akhdar': 'لخضاري محمد الأخضر', 'Mohamed Tahar El Obeidi': 'محمد الطاهر العبيدي', 'Koraichi Mohamed Ennagi': 'قريشي محمد الناجي',
  'Ben Malek Mohamed Hassan': 'بن مالك محمد حسن', 'Ben Dahman Bachir': 'بن دحمان بشير', 'Hassani Mohamed Ben Brahim': 'حساني محمد بن إبراهيم', 'Ben Chikhe Telli': 'بن الشيخ التلي',
  'Choisir un service': 'اختيار المصلحة', 'Quel service souhaitez-vous joindre ?': 'أي مصلحة تودّ التواصل معها؟', 'Chaque signalement sera transmis à l’équipe concernée.': 'سيُرسل كل بلاغ إلى الفريق المعني.',
  'Restauration': 'الإطعام', 'Hébergement': 'الإيواء', 'Santé': 'الوقاية الصحية', 'Transport': 'النقل', 'Activités': 'الأنشطة',
  'Repas & restaurant': 'الوجبات والمطعم', 'Chambres & équipements': 'الغرف والتجهيزات', 'Infirmerie & prévention': 'العيادة والوقاية', 'Navettes & mobilité': 'الحافلات والتنقل', 'Sport, culture & loisirs': 'الرياضة والثقافة والترفيه',
  'Services présentés d’après les missions universitaires courantes.': 'المصالح المعروضة مبنية على المهام المعتادة للخدمات الجامعية.',
  'Nouveau signalement': 'بلاغ جديد', 'Dites-nous ce qui se passe.': 'أخبرنا بما يحدث.', 'Votre signalement sera transmis au service': 'سيُرسل بلاغك إلى مصلحة', 'de': 'بإقامة',
  'SUJET': 'الموضوع', 'Propreté': 'النظافة', 'Équipement': 'التجهيزات', 'Qualité': 'الجودة', 'Autre': 'أخرى', 'DÉTAILS': 'التفاصيل', 'Décrivez le problème et indiquez où il se trouve…': 'صِف المشكلة وحدّد مكانها…',
  'PHOTO (FACULTATIF)': 'صورة (اختياري)', 'Photo': 'صورة', 'L’ajout de photo sera activé dans la version connectée.': 'ستُفعّل إضافة الصور في النسخة المتصلة بالخادم.', 'Ajouter une photo': 'إضافة صورة',
  'Envoyer le signalement  →': 'إرسال البلاغ ←', 'Un détail est nécessaire': 'التفاصيل مطلوبة', 'Décrivez brièvement le problème avant l’envoi.': 'صِف المشكلة بإيجاز قبل الإرسال.', 'Signalement enregistré': 'تم تسجيل البلاغ', 'Votre demande apparaît dans votre suivi.': 'يظهر طلبك في قائمة المتابعة.',
  'Boîte de réception': 'صندوق الوارد', 'Mes messages': 'رسائلي', 'Suivez les réponses des équipes de votre résidence.': 'تابع ردود فرق إقامتك.',
  'Éclairage du couloir': 'إنارة الممر', 'Repas du soir': 'وجبة العشاء', 'En cours': 'قيد المعالجة', 'Réponse reçue': 'تم استلام الرد', 'Aujourd’hui · 09:42': 'اليوم · 09:42', 'Hier · 18:20': 'أمس · 18:20',
  'Bonjour, la lumière du couloir du 2e étage ne fonctionne plus depuis hier soir.': 'مرحبًا، إنارة ممر الطابق الثاني لا تعمل منذ مساء أمس.', 'Merci pour votre retour. Le menu de cette semaine sera transmis à l’équipe.': 'شكرًا على ملاحظتك. ستُرسل قائمة وجبات هذا الأسبوع إلى الفريق.',
  'Ouvrir la conversation et répondre (serveur requis pour les messages réels).': 'فتح المحادثة والرد (الرسائل الفعلية تتطلب خادمًا).', 'Répondre  →': 'الرد ←', 'Voir la conversation  →': 'عرض المحادثة ←',
  'Messages équipe ↔ gestionnaire': 'رسائل الفريق ↔ المدير', 'Les échanges privés et la messagerie par résidence seront disponibles après connexion au serveur STC.': 'ستتاح المحادثات الخاصة ورسائل الإقامة بعد الاتصال بخادم STC.',
  'Mon espace': 'فضائي', 'MON COMPTE': 'حسابي', 'Informations personnelles': 'المعلومات الشخصية', 'Modifier le profil': 'تعديل الملف الشخصي', 'Votre nom et votre rôle sont modifiables après 14 jours.': 'يمكن تعديل اسمك ودورك بعد 14 يومًا.',
  'Photo de profil': 'الصورة الشخصية', 'La photo de profil pourra être ajoutée ou modifiée à tout moment.': 'يمكن إضافة الصورة الشخصية أو تغييرها في أي وقت.', 'Changement de rôle': 'تغيير الدور', 'Disponible dans 14 jours': 'متاح بعد 14 يومًا', '14 j': '14 يومًا',
  'DÉCOUVRIR STC': 'اكتشف STC', 'STC Officiel': 'موقع STC الرسمي', 'Projets STC': 'مشاريع STC', 'À propos de l’application': 'حول التطبيق', 'Découvrez les projets de STC.': 'اكتشف مشاريع STC.', 'Se déconnecter': 'تسجيل الخروج',
  'Espace service': 'فضاء المصلحة', 'Accueil': 'الرئيسية', 'Messages': 'الرسائل', 'Espace équipe en aperçu · validation active': 'معاينة فضاء الفريق · الموافقة مفعّلة',
  'Bonjour, l’équipe': 'مرحبًا بالفريق', 'Bonjour, Samira': 'مرحبًا سميرة', 'Les demandes, à portée de main.': 'كل الطلبات بين يديك.', 'Un petit geste peut améliorer la vie de tous.': 'خطوة صغيرة تحسّن حياة الجميع.',
  'Consultez les demandes de votre service.': 'اطّلع على طلبات مصلحتك.', 'Votre voix compte dans votre résidence.': 'صوتك مهم في إقامتك.', 'À traiter': 'بانتظار المعالجة', 'Résolus': 'تم الحل', 'Demandes récentes': 'أحدث الطلبات', 'Tout voir →': 'عرض الكل ←',
  'NOUVEAU': 'جديد', 'Bloc B · 2e étage · #SR-024': 'الجناح B · الطابق الثاني · #SR-024', 'La lumière du couloir ne fonctionne plus depuis hier soir…': 'إنارة الممر لا تعمل منذ مساء أمس…',
  'Ouvrir & répondre': 'فتح والرد', 'Débloquer': 'رفع الحظر', 'Gérer l’accès': 'إدارة الوصول', 'Outils équipe': 'أدوات الفريق', 'Équipe': 'الفريق', 'Demandes de rôles': 'طلبات الأدوار', 'Utilisateurs': 'المستخدمون', '1 compte restreint': 'حساب واحد مقيّد', 'Accès & modération': 'الوصول والإشراف',
  'Signaler un problème': 'التبليغ عن مشكلة', 'Mes demandes': 'طلباتي', 'À l’instant': 'الآن', 'Votre signalement a été envoyé': 'تم إرسال بلاغك', 'Tout est à jour': 'كل شيء محدّث', 'Vos nouvelles demandes apparaîtront ici.': 'ستظهر طلباتك الجديدة هنا.',
  'Comment se passe la vie ici ?': 'كيف تقيّم الحياة هنا؟', 'Évaluez votre résidence': 'قيّم إقامتك', 'GESTIONNAIRE · VUE GLOBALE': 'المدير · نظرة شاملة', '11 résidences · demandes de rôle · annonces ciblées': '11 إقامة · طلبات أدوار · إعلانات موجّهة',
  'Écrire une annonce pour les résidents…': 'اكتب إعلانًا للمقيمين…', 'Tous': 'الجميع', 'Résidence': 'الإقامة', 'Étudiants': 'الطلبة', 'Prévisualiser l’annonce': 'معاينة الإعلان', 'Annonce': 'إعلان', 'Écrivez une annonce avant de la prévisualiser.': 'اكتب إعلانًا قبل معاينته.', 'Découvrir STC →': 'اكتشف STC ←',
  'Ouargla ·': 'ورقلة ·', '‹': '›', '›': '‹', '↗': '↖', '→': '←',
};
const normalized = new Map(Object.entries(arabic).map(([key, value]) => [key.normalize('NFC').toLowerCase(), value]));
export function translate(text: string, language: 'fr' | 'ar'): string {
  if (language === 'fr') return text;
  const trimmed = text.trim();
  const value = normalized.get(trimmed.normalize('NFC').toLowerCase());
  if (value) return text.replace(trimmed, value);
  if (text.endsWith(' sera ajoutée prochainement.')) return `ستُضاف إقامة ${translate(text.replace(' sera ajoutée prochainement.', ''), language)} قريبًا.`;
  if (text.startsWith('Signalements pour ')) return `بلاغات مصلحة ${translate(text.slice(17), language)}`;
  if (text.startsWith('TABLEAU DE BORD · ')) return `لوحة المتابعة · ${translate(text.slice(17), language)}`;
  return text;
}
const LanguageContext = createContext({ language: 'fr' as 'fr' | 'ar', setLanguage: (_language: 'fr' | 'ar') => {} });
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, update] = useState<'fr' | 'ar'>('fr');
  const chosen = useRef(false);
  useEffect(() => { let active = true; AsyncStorage.getItem('stc.language').then(value => { if (active && !chosen.current && (value === 'fr' || value === 'ar')) update(value); }).catch(() => {}); return () => { active = false; }; }, []);
  const setLanguage = (value: 'fr' | 'ar') => { chosen.current = true; update(value); void AsyncStorage.setItem('stc.language', value).catch(() => {}); };
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  return { ...context, rtl: context.language === 'ar', t: (text: string) => translate(text, context.language) };
}
// Only UI copy is translated. User-authored content opts out with raw.
export function Text({ children, style, raw = false, ...props }: TextProps & { raw?: boolean }) {
  const { rtl, t } = useLanguage();
  return <NativeText {...props} style={[{ textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }, style, rtl && { letterSpacing: 0 }]}>{raw ? children : React.Children.map(children, child => typeof child === 'string' ? t(child) : child)}</NativeText>;
}
export function TextInput({ placeholder, style, ...props }: TextInputProps) {
  const { rtl, t } = useLanguage();
  return <NativeInput {...props} placeholder={placeholder ? t(placeholder) : undefined} style={[style, { textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }]} />;
}
export function LanguageSwitch({ light = false }: { light?: boolean }) {
  const { language, setLanguage } = useLanguage();
  return <Pressable accessibilityRole="button" accessibilityLabel={language === 'ar' ? 'التغيير إلى الفرنسية' : 'Passer en arabe'} onPress={() => setLanguage(language === 'ar' ? 'fr' : 'ar')} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: light ? 'rgba(255,255,255,.1)' : '#EAF7F0' }}><NativeText style={{ color: light ? '#B9ED77' : '#16845A', fontWeight: '700', fontSize: 13 }}>{language === 'ar' ? 'FR' : 'العربية'}</NativeText></Pressable>;
}
export function useLocalizedAlert() {
  const { t, rtl } = useLanguage();
  return { alert: (title: string, message: string, raw = false) => Alert.alert(t(title), raw ? message : t(message), [{ text: rtl ? 'حسنًا' : 'OK' }]) };
}
