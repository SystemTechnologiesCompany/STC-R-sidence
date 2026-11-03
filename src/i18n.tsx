import DropdownArrow from '../assets/stc-icons/arrow-drop-down-svgrepo-com.svg';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Modal, Image, View, ScrollView, StyleSheet, useWindowDimensions, Pressable, Text as NativeText, TextInput as NativeInput, type TextProps, type TextInputProps } from 'react-native';
import { PopIn } from './motion';
import AsyncStorage from '@react-native-async-storage/async-storage';

const arabic: Record<string, string> = {
  'Pas de connexion Internet': 'لا يوجد اتصال بالإنترنت',
  'Supabase non configuré': 'لم يتم إعداد Supabase',
  'Ajoutez l’URL et la clé publique de votre projet Supabase dans le fichier .env, puis redémarrez Expo.': 'أضف رابط مشروع Supabase والمفتاح العام إلى ملف .env، ثم أعد تشغيل Expo.',
  'Vérifiez votre Wi-Fi ou vos données mobiles, puis réessayez.': 'تحقق من شبكة الواي فاي أو بيانات الهاتف، ثم أعد المحاولة.',
  'Vérification…': 'جارٍ التحقق…', 'Réessayer': 'إعادة المحاولة',
  'Votre espace sera prêt dès le retour de la connexion.': 'سيكون فضاؤك جاهزًا عند عودة الاتصال.',
  'Mon compte': 'حسابي', 'Nom complet': 'الاسم الكامل', 'Saisissez votre nom': 'أدخل اسمك',
  'Annuler': 'إلغاء', 'Enregistrer': 'حفظ', 'Enregistrement…': 'جارٍ الحفظ…',
  'Votre nom est modifiable 14 jours après sa première saisie.': 'يمكن تعديل اسمك بعد 14 يومًا من إدخاله لأول مرة.',
  'Veuillez patienter ou réouvrir l’application.': 'يرجى الانتظار أو إعادة فتح التطبيق.',
  'Le nom doit contenir entre 2 et 60 caractères.': 'يجب أن يتكون الاسم من حرفين إلى 60 حرفًا.',
  'Impossible d’enregistrer le nom. Réessayez.': 'تعذّر حفظ الاسم. أعد المحاولة.',
  'Poste déjà occupé': 'المنصب مشغول بالفعل',
  'Cette résidence possède déjà un gestionnaire. Un seul gestionnaire est autorisé par résidence.': 'يوجد مدير لهذه الإقامة بالفعل. يُسمح بمدير واحد فقط لكل إقامة.',
  'Ce service possède déjà un responsable dans cette résidence. Un seul responsable est autorisé par service.': 'يوجد مسؤول لهذه المصلحة في هذه الإقامة بالفعل. يُسمح بمسؤول واحد فقط لكل مصلحة.',
  'Vérification indisponible': 'تعذّر التحقق',
  'Impossible de vérifier les postes. Réessayez avant de continuer.': 'تعذّر التحقق من المناصب. أعد المحاولة قبل المتابعة.',
  'Continuer en démonstration': 'المتابعة في النسخة التجريبية',
  'Mode démonstration · sans connexion à un compte réel.': 'وضع تجريبي · دون تسجيل الدخول إلى حساب حقيقي.',
  'Choisissez votre résidence': 'اختر إقامتك',
  'Demandes de votre service uniquement': 'طلبات مصلحتك فقط',
  'Suivi des demandes': 'متابعة الطلبات', 'Tous les services de votre résidence': 'جميع مصالح إقامتك',
  'Terminées': 'مكتملة', 'En attente': 'قيد الانتظار', 'Alerte · 3 jours': 'تنبيه · 3 أيام',
  'Demandes sans réponse': 'طلبات دون رد',
  'Ces demandes ne sont pas terminées et n’ont reçu aucune réponse administrative depuis au moins 72 heures.': 'هذه الطلبات لم تُنجز ولم تتلقَّ أي رد من المسؤولين منذ 72 ساعة على الأقل.',
  'Aperçu · exemples de demandes inclus': 'معاينة · تتضمن طلبات تجريبية',
  'Demande': 'الطلب', 'Service': 'المصلحة', 'État': 'الحالة',
  'Aucune demande pour le moment.': 'لا توجد طلبات حاليًا.',
  'Rouge : non terminée, sans réponse depuis 3 jours.': 'الأحمر: غير مكتملة ودون رد منذ 3 أيام.',
  'Maintenance': 'الصيانة', 'Réparations & entretien': 'الإصلاحات والصيانة',
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
  'Choisissez un sujet': 'اختر موضوعًا', 'Sélectionnez un sujet pour votre signalement.': 'اختر موضوعًا لبلاغك.',
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
  'Annonce de résidence': 'إعلان الإقامة', 'Sans destinataire sélectionné, l’annonce sera envoyée à toute la résidence.': 'إذا لم يتم اختيار مستلمين، فسيُرسل الإعلان إلى جميع المقيمين.',
  'Destinataires facultatifs': 'مستلمون اختياريون', 'Tout le monde': 'الجميع', 'Aucun membre trouvé.': 'لم يتم العثور على أعضاء.',
  'Envoyer à toute la résidence': 'إرسال إلى جميع المقيمين', 'Annonce envoyée': 'تم إرسال الإعلان',
  'Envoyée à toute la résidence.': 'تم الإرسال إلى جميع المقيمين.', 'Annonce non envoyée': 'لم يتم إرسال الإعلان',
  'Impossible de charger les résidents': 'تعذّر تحميل المقيمين', 'Marquer comme terminé': 'تحديد كمكتمل',
  'Clôture…': 'جارٍ الإغلاق…', 'Impossible de clôturer le signalement': 'تعذّر إغلاق البلاغ',
  'Envoyer à': 'إرسال إلى', 'personne(s)': 'أشخاص',
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
type Notice = { title: string; message: string };
const NoticeContext = createContext<(notice: Notice) => void>(() => {});
const LanguageContext = createContext({ language: 'fr' as 'fr' | 'ar', setLanguage: (_language: 'fr' | 'ar') => {} });
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [language, update] = useState<'fr' | 'ar'>('fr');
  const chosen = useRef(false);
  useEffect(() => { let active = true; AsyncStorage.getItem('stc.language').then(value => { if (active && !chosen.current && (value === 'fr' || value === 'ar')) update(value); }).catch(() => {}); return () => { active = false; }; }, []);
  const setLanguage = (value: 'fr' | 'ar') => { chosen.current = true; update(value); void AsyncStorage.setItem('stc.language', value).catch(() => {}); };
  return <LanguageContext.Provider value={{ language, setLanguage }}><NoticeContext.Provider value={setNotice}>{children}<Modal transparent visible={notice !== null} animationType="fade" onRequestClose={() => setNotice(null)}><View style={popup.overlay}><Pressable style={StyleSheet.absoluteFill} accessibilityLabel={language === 'ar' ? 'إغلاق' : 'Fermer'} onPress={() => setNotice(null)} />{notice && <PopIn style={popup.dialog}><View accessibilityViewIsModal style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}><View style={popup.badge}><Image source={require('../assets/stc-logo.png')} accessibilityLabel="STC Résidence" resizeMode="contain" style={{ width: 44, height: 44 }} /></View><Text raw accessibilityRole="header" style={popup.title}>{notice.title}</Text><ScrollView style={{ maxHeight: 300 }}><Text raw style={popup.body}>{notice.message}</Text></ScrollView><Pressable accessibilityRole="button" onPress={() => setNotice(null)} style={popup.confirm}><NativeText style={popup.confirmText}>{language === 'ar' ? 'حسنًا' : 'D’accord'}</NativeText></Pressable></View></PopIn>}</View></Modal></NoticeContext.Provider></LanguageContext.Provider>;
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
  const { language, setLanguage, rtl } = useLanguage();
  const [anchor, setAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const trigger = useRef<React.ElementRef<typeof View>>(null);
  const { width, height } = useWindowDimensions();
  useEffect(() => { setAnchor(null); }, [width, height]);
  const menuWidth = Math.min(210, width - 32);
  return <><Pressable ref={trigger} accessibilityRole="button" accessibilityLabel={rtl ? 'اختيار اللغة' : 'Choisir la langue'} accessibilityState={{ expanded: anchor !== null }} onPress={() => trigger.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }))} style={[popup.languageTrigger, { backgroundColor: light ? 'rgba(255,255,255,.1)' : '#EAF7F0' }]}><NativeText style={{ color: light ? '#B9ED77' : '#16845A', fontWeight: '700' }}>{rtl ? 'العربية' : 'FR'}</NativeText><DropdownArrow width={24} height={24} color={light ? '#B9ED77' : '#16845A'} style={{ transform: [{ rotate: anchor ? '180deg' : '0deg' }] }} /></Pressable>
    <Modal transparent visible={anchor !== null} animationType="fade" onRequestClose={() => setAnchor(null)}><View style={{ flex: 1 }}><Pressable style={StyleSheet.absoluteFill} accessibilityLabel={rtl ? 'إغلاق' : 'Fermer'} onPress={() => setAnchor(null)} />{anchor && <PopIn style={{ ...popup.menu, width: menuWidth, left: Math.max(16, Math.min(width - menuWidth - 16, rtl ? anchor.x : anchor.x + anchor.width - menuWidth)), top: Math.max(16, Math.min(anchor.y + anchor.height + 8, height - 180)) }}><Text raw style={popup.menuHeading}>{rtl ? 'اللغة' : 'Langue'}</Text>{(['fr', 'ar'] as const).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: language === value }} onPress={() => { setLanguage(value); setAnchor(null); }} style={[popup.option, { flexDirection: rtl ? 'row-reverse' : 'row' }, language === value && popup.optionSelected]}><NativeText style={popup.optionText}>{value === 'fr' ? 'Français' : 'العربية'}</NativeText><NativeText style={popup.optionText}>{language === value ? '✓' : ''}</NativeText></Pressable>)}</PopIn>}</View></Modal></>;
}
export function useLocalizedAlert() {
  const { t } = useLanguage();
  const show = useContext(NoticeContext);
  return { alert: (title: string, message: string, raw = false) => show({ title: t(title), message: raw ? message : t(message) }) };
}
const popup = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(16,61,46,.38)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 420, padding: 24, borderRadius: 28, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EDE8', shadowColor: '#103D2E', shadowOpacity: .16, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  badge: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#EAF7F0', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  badgeText: { color: '#16845A', fontSize: 15, fontWeight: '900' },
  title: { fontSize: 21, fontWeight: '800', color: '#103D2E', marginBottom: 10 },
  body: { fontSize: 14, lineHeight: 23, color: '#78877F' },
  confirm: { minHeight: 50, marginTop: 24, borderRadius: 16, backgroundColor: '#16845A', alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: 'white', fontSize: 14, fontWeight: '800' },
  languageTrigger: { flexDirection: 'row', gap: 2, minWidth: 54, minHeight: 44, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  menu: { position: 'absolute', padding: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EDE8', shadowColor: '#103D2E', shadowOpacity: .18, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  menuHeading: { paddingHorizontal: 12, paddingVertical: 8, color: '#78877F', fontSize: 11, fontWeight: '700' },
  option: { minHeight: 48, borderRadius: 13, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'space-between' },
  optionSelected: { backgroundColor: '#EAF7F0' },
  optionText: { fontSize: 14, fontWeight: '700', color: '#16845A' },
});
