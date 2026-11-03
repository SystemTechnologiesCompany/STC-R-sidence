import { GreenCard } from './src/GreenCard';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { OfflineScreen } from './src/OfflineScreen';
import { ProfileNameEditor, useProfileName } from './src/ProfileName';
import { ServiceRequests } from './src/ServiceRequests';
import { ManagerRequests } from './src/ManagerRequests';
import { ResidenceInbox } from './src/ResidenceInbox';
import { ManagerTeam } from './src/ManagerTeam';
import { ManagerAnnouncements } from './src/ManagerAnnouncements';
import { MajorUpdates } from './src/MajorUpdates';
import Constants from 'expo-constants';
import { ProfilePhoto, ReportPhotoPicker, uploadPhoto, removePhoto, photoError, type SelectedPhoto } from './src/photos';
import type { ResidenceRequest } from './src/requests';
import { usePageNavigation, type Page } from './src/usePageNavigation';
import { ScreenTransition } from './src/motion';
import { BottomNavigation } from './src/BottomNavigation';
import { supabase, supabaseConfigured } from './src/supabase';
import type * as ExpoUpdates from 'expo-updates';
import type * as ExpoNotifications from 'expo-notifications';
import { addNotificationResponseListener, getLastNotificationResponse, registerPushNotifications } from './src/pushNotifications';
import { nativeGoogleSignIn } from './src/nativeGoogleSignIn';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';
import BusIcon from './assets/stc-icons/bus-3-svgrepo-com.svg';
import EditIcon from './assets/stc-icons/edit-3-svgrepo-com.svg';
import FoodIcon from './assets/stc-icons/food-dish-svgrepo-com.svg';
import GoogleIcon from './assets/stc-icons/google.svg';
import HouseIcon from './assets/stc-icons/house-smile-svgrepo-com.svg';
import { LanguageProvider, LanguageSwitch, Text, TextInput, useLanguage, useLocalizedAlert } from './src/i18n';
import MedalIcon from './assets/stc-icons/medal-svgrepo-com.svg';
import MedicalIcon from './assets/stc-icons/medical-kit-svgrepo-com.svg';
import MaintenanceIcon from './assets/stc-icons/maintenance-electric-car-svgrepo-com.svg';
import MessagesIcon from './assets/stc-icons/messages-2-svgrepo-com.svg';
import ShareIcon from './assets/stc-icons/share-nodes-svgrepo-com.svg';
import StudentIcon from './assets/stc-icons/student-person-4-svgrepo-com.svg';
import TeamIcon from './assets/stc-icons/team-svgrepo-com.svg';
import UserIcon from './assets/stc-icons/user-svgrepo-com.svg';
import WatchIcon from './assets/stc-icons/watch-round-svgrepo-com.svg';

const appLogo = require('./assets/stc-logo.png');
const Updates: typeof ExpoUpdates | null = (() => {
  try {
    return require('expo-updates') as typeof ExpoUpdates;
  } catch {
    // Expo Go or an older installed client may not include the native Updates module.
    return null;
  }
})();
function AppLogo({ size = 32 }: { size?: number }) {
  return <Image source={appLogo} accessibilityLabel="STC Résidence" resizeMode="contain" style={{ width: size, height: size }} />;
}

type Role = 'student' | 'staff' | 'manager';
type BackendProfile = { id: string; full_name: string; name_last_changed_at: string; name_changes_used: number; residence_id: string; role: Role; service: string | null; role_status: 'active' | 'pending' | 'rejected' };
type ServiceIcon = React.ComponentType<SvgProps>;
const C = { green: '#16845A', dark: '#103D2E', mint: '#EAF7F0', lime: '#B9ED77', ink: '#18241F', muted: '#78877F', line: '#E6EDE8', white: '#FFFFFF', canvas: '#F6F9F6', orange: '#EF9C54' };
const residences = [
  'Khelafoui El-Hadj', 'Abou Ammar Abdel Kafi', 'Salem Ben Younes', 'Ben Moussa Mohamed',
  'Lakhdari Mohamed Al Akhdar', 'Mohamed Tahar El Obeidi', 'Koraichi Mohamed Ennagi',
  'Ben Malek Mohamed Hassan', 'Ben Dahman Bachir', 'Hassani Mohamed Ben Brahim', 'Ben Chikhe Telli',
];
const services = [
  { name: 'Restauration', ar: 'الإطعام', icon: FoodIcon, tint: '#FFF3E7', caption: 'Repas & restaurant' },
  { name: 'Hébergement', ar: 'الإيواء', icon: HouseIcon, tint: '#EAF4FF', caption: 'Chambres & équipements' },
  { name: 'Maintenance', ar: 'الصيانة', icon: MaintenanceIcon, tint: '#EDF4E8', caption: 'Réparations & entretien' },
  { name: 'Santé', ar: 'الوقاية الصحية', icon: MedicalIcon, tint: '#FDEEEF', caption: 'Infirmerie & prévention' },
  { name: 'Transport', ar: 'النقل', icon: BusIcon, tint: '#F1ECFF', caption: 'Navettes & mobilité' },
  { name: 'Activités', ar: 'الأنشطة', icon: MedalIcon, tint: '#E8F8F6', caption: 'Sport, culture & loisirs' },
];
const navItems = [
  { label: 'Accueil', icon: HouseIcon },
  { label: 'Messages', icon: MessagesIcon },
  { label: 'Mon espace', icon: UserIcon },
] as const;

function Button({ title, onPress, secondary = false, small = false }: { title: string; onPress: () => void; secondary?: boolean; small?: boolean }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.buttonSecondary, small && styles.buttonSmall, pressed && { opacity: .82, transform: [{ scale: .985 }] }]}><Text style={[styles.buttonText, secondary && styles.buttonSecondaryText, small && { fontSize: 13 }]}>{title}</Text></Pressable>;
}
function Tag({ children, color = C.green, bg = C.mint }: { children: React.ReactNode; color?: string; bg?: string }) {
  return <View style={[styles.tag, { backgroundColor: bg }]}><Text style={{ color, fontSize: 11, fontWeight: '700' }}>{children}</Text></View>;
}
function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  return <View style={styles.header}>{onBack ? <Pressable onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable> : <View style={styles.logoMini}><AppLogo size={32} /></View>}<Text style={styles.headerTitle}>{title}</Text><View style={{ marginStart: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8 }}>{right}<LanguageSwitch /></View></View>;
}

export default function App() {
  return <LanguageProvider><ResidenceApp /></LanguageProvider>;
}

function ResidenceApp() {
  const { rtl, language } = useLanguage();
  const Alert = useLocalizedAlert();
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleSignInBusy = useRef(false);
  const pendingNotificationPage = useRef<Page | null>(null);
  const [releaseRefreshKey, setReleaseRefreshKey] = useState(0);
  const [oauthName, setOauthName] = useState('');
  const [backendProfile, setBackendProfile] = useState<BackendProfile | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'ready'>('idle');
  const checkForAppUpdate = async () => {
    const updates = Updates;
    if (__DEV__ || !updates?.isEnabled) { Alert.alert('Mise à jour indisponible', 'Les mises à jour sont disponibles dans la version installée depuis EAS.'); return; }
    try {
      setUpdateStatus('checking');
      const result = await updates.checkForUpdateAsync();
      if (!result.isAvailable) { setUpdateStatus('idle'); Alert.alert('Application à jour', 'Vous utilisez la dernière version disponible.'); return; }
      await updates.fetchUpdateAsync();
      setUpdateStatus('ready');
      Alert.alert('Mise à jour prête', 'La mise à jour est téléchargée. Redémarrez l’application pour l’installer.');
    } catch (error) { setUpdateStatus('idle'); Alert.alert('Vérification impossible', error instanceof Error ? error.message : 'Réessayez plus tard.'); }
  };
  React.useEffect(() => { nativeGoogleSignIn?.GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, offlineAccess: false }); }, []);
  const signInWithGoogle = async () => {
    if (!nativeGoogleSignIn) { Alert.alert('Connexion Google', 'Pour vous connecter avec Google, ouvrez la version APK de STC Résidence. Expo Go permet de consulter le design.'); return; }
    const { GoogleSignin, statusCodes } = nativeGoogleSignIn;
    if (!supabaseConfigured) { Alert.alert('Supabase non configuré', 'Ajoutez l’URL et la clé publique de votre projet Supabase dans le fichier .env, puis redémarrez Expo.'); return; }
    if (googleSignInBusy.current) return;
    googleSignInBusy.current = true;
    setGoogleLoading(true);
    let loginStage = 'Google';
    try {
      if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) throw new Error('Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env and restart Expo.');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Clear this app's remembered Google account before interactive sign-in.
      // Android then presents its native account chooser on each button press.
      await GoogleSignin.signOut();
      const response = await GoogleSignin.signIn();
      if (response.type !== 'success') return;
      const idToken = response.data.idToken;
      if (!idToken) throw new Error('Google did not return an ID token. Check the Android and Web OAuth client configuration.');
      loginStage = 'Supabase Auth';
      const { data: authData, error: sessionError } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
      if (sessionError) throw sessionError;
      const signedInUser = authData.user;
      const googleName = typeof signedInUser.user_metadata?.full_name === 'string'
        ? signedInUser.user_metadata.full_name
        : signedInUser.email?.split('@')[0] ?? '';
      setOauthName(googleName);
      loginStage = 'Profil Supabase';
      const { data: profileData, error: profileError } = await supabase.from('profiles')
        .select('id,full_name,name_last_changed_at,name_changes_used,residence_id,role,service,role_status').eq('id', signedInUser.id).maybeSingle();
      if (profileError) throw profileError;
      if (profileData) {
        const profile = profileData as BackendProfile;
        setBackendProfile(profile);
        setOauthName(profile.full_name);
        setRole(profile.role);
        setService(profile.service ?? 'Restauration');
        const { data: residenceData, error: residenceError } = await supabase.from('residences')
          .select('name').eq('id', profile.residence_id).maybeSingle();
        if (residenceError) throw residenceError;
        if (residenceData?.name) setResidence(residenceData.name);
        setPage(profile.role === 'staff' && profile.role_status !== 'active' ? 'team' : pendingNotificationPage.current ?? 'home');
      } else if (role === 'manager') {
        Alert.alert('Accès gestionnaire requis', 'Le gestionnaire doit être activé sur votre compte avant de continuer.');
        await supabase.auth.signOut();
      } else {
        setPage('residence');
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === statusCodes.SIGN_IN_CANCELLED) return;
      const details = error && typeof error === 'object' ? error as { message?: unknown; code?: unknown } : null;
      const message = typeof details?.message === 'string' ? details.message : 'Impossible de se connecter avec Google.';
      const code = typeof details?.code === 'string' || typeof details?.code === 'number' ? ` (${details.code})` : '';
      Alert.alert('Connexion Google', `${loginStage}${code}\n${message}`, true);
    } finally { googleSignInBusy.current = false; setGoogleLoading(false); }
  };
  const [online, setOnline] = useState<boolean | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const retryConnection = async () => {
    setCheckingConnection(true);
    try {
      const state: NetInfoState = await NetInfo.fetch();
      setOnline(state.isConnected === true && state.isInternetReachable !== false);
    } catch {
      setOnline(false);
    } finally {
      setCheckingConnection(false);
    }
  };
  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => setOnline(state.isConnected === true && state.isInternetReachable !== false));
    void retryConnection();
    return unsubscribe;
  }, []);
  const account = useProfileName(backendProfile, updated => {
    setBackendProfile(current => current?.id === updated.id ? { ...current, ...updated } : current);
    setOauthName(updated.full_name);
  });
  const [editingName, setEditingName] = useState(false);
  const { page, setPage, goBack } = usePageNavigation();
  const [role, setRole] = useState<Role>('student');
  const [residence, setResidence] = useState(residences[0]);
  const [service, setService] = useState('Restauration');
  const [staffAssignment, setStaffAssignment] = useState<{ service: string; residence: string } | null>(null);
  const tab = page === 'inbox' ? 'Messages' : page === 'profile' ? 'Mon espace' : 'Accueil';
  const [rating, setRating] = useState(0);
  const [report, setReport] = useState('');
  const [reportSubject, setReportSubject] = useState<string | null>(null);
  const [requests, setRequests] = useState<ResidenceRequest[]>([]);
  const [reportSending, setReportSending] = useState(false);
  const [reportPhoto, setReportPhoto] = useState<SelectedPhoto | null>(null);
  const [avatarRevision, setAvatarRevision] = useState(0);
  React.useEffect(() => {
    if (!backendProfile || !['manager', 'staff'].includes(backendProfile.role) || !backendProfile.residence_id) { setRequests([]); return; }
    let alive = true;
    const loadManagerRequests = async () => {
      let query = supabase.from('reports')
        .select('id,subject,service,residence_id,created_at,status,admin_replied_at')
        .eq('residence_id', backendProfile.residence_id);
      if (backendProfile.role === 'staff' && backendProfile.service) {
        query = query.eq('service', backendProfile.service);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!alive) return;
      if (error) { Alert.alert('Impossible de charger les demandes', error.message, true); return; }
      setRequests((data ?? []).map(row => ({
        id: row.id, title: row.subject, service: row.service, residence,
        createdAt: Date.parse(row.created_at), status: row.status === 'done' ? 'done' : 'queued',
        adminRepliedAt: row.admin_replied_at ? Date.parse(row.admin_replied_at) : null,
      })));
    };
    void loadManagerRequests();
    const channel = supabase.channel(`manager-dashboard-${backendProfile.residence_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `residence_id=eq.${backendProfile.residence_id}` }, () => { void loadManagerRequests(); })
      .subscribe();
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, [backendProfile?.id, backendProfile?.residence_id, backendProfile?.role, backendProfile?.service, residence]);
  React.useEffect(() => {
    let alive = true;
    const restoreAccount = async (userId: string) => {
      const { data, error } = await supabase.from('profiles')
        .select('id,full_name,name_last_changed_at,name_changes_used,residence_id,role,service,role_status')
        .eq('id', userId).maybeSingle();
      if (!alive) return;
      if (error) {
        console.warn('Could not restore Supabase profile:', error.message);
        return;
      }
      if (!data) {
        setBackendProfile(null);
        setPage('residence');
        return;
      }
      const profile = data as BackendProfile;
      setBackendProfile(profile);
      setRole(profile.role);
      setOauthName(profile.full_name);
      setService(profile.service ?? 'Restauration');
      setStaffAssignment(profile.role === 'staff' ? { service: profile.service ?? '', residence: '' } : null);
      const { data: residenceData, error: residenceError } = await supabase.from('residences')
        .select('name').eq('id', profile.residence_id).maybeSingle();
      if (!alive) return;
      if (residenceError) console.warn('Could not restore residence:', residenceError.message);
      else if (residenceData?.name) setResidence(residenceData.name);
      setPage(profile.role === 'staff' && profile.role_status !== 'active' ? 'team' : pendingNotificationPage.current ?? 'home');
    };
    const register = (userId: string) => {
      void registerPushNotifications(userId).catch(error => {
        console.warn('Push notification registration failed:', error);
      });
    };
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (data.session) {
        register(data.session.user.id);
        void restoreAccount(data.session.user.id);
      } else setPage('welcome');
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        const userId = session.user.id;
        // Defer Supabase calls out of the auth callback to avoid re-entering its session lock.
        setTimeout(() => {
          if (!alive) return;
          register(userId);
          void restoreAccount(userId);
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setBackendProfile(null);
        setOauthName('');
        setRole('student');
        setStaffAssignment(null);
        setPage('welcome');
      }
    });
    const openDestination = (response: ExpoNotifications.NotificationResponse | null) => {
      const kind = response?.notification.request.content.data?.type;
      if (kind === 'major_update') {
        pendingNotificationPage.current = 'profile';
        setReleaseRefreshKey(value => value + 1);
        setPage('profile');
      }
      else if (kind === 'report_received' || kind === 'report_response') setPage('inbox');
    };
    openDestination(getLastNotificationResponse());
    const responseListener = addNotificationResponseListener(openDestination);
    return () => {
      alive = false;
      authListener.subscription.unsubscribe();
      responseListener?.remove();
    };
  }, [setPage]);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isStaff = role !== 'student';
  const requestAccess = { role, residence: role === 'staff' ? (staffAssignment?.residence ?? '') : residence, assignedService: staffAssignment?.service ?? null };
  const continueResidence = async () => {
    if (role === 'manager') {
      if (backendProfile?.role !== 'manager' || backendProfile.role_status !== 'active') {
        Alert.alert('Accès gestionnaire requis', 'Le gestionnaire doit être activé sur votre compte avant de continuer.');
        return;
      }
      setPage('home');
      return;
    }
    if (role === 'student') {
      const profile = await registerResidenceProfile('student');
      if (!profile) return;
    }
    setPage('services');
  };
  const selectService = async (name: string) => {
    if (role === 'staff') {
      if (staffAssignment && (staffAssignment.service !== name || staffAssignment.residence !== residence)) return;
      const profile = await registerResidenceProfile('staff', name);
      if (!profile) return;
      if (profile.role_status === 'pending') { setStaffAssignment({ service: name, residence }); setService(name); setPage('team'); return; }
      if (profile.role !== 'staff' || profile.service !== name) {
        Alert.alert('Rôle déjà associé', 'Votre compte possède déjà un rôle ou un service différent. Contactez le gestionnaire pour le modifier.');
        return;
      }
      setBackendProfile(profile);
      setStaffAssignment({ service: name, residence });
    }
    setService(name); setPage('home');
  };

  const registerResidenceProfile = async (requestedRole: 'student' | 'staff', requestedService: string | null = null): Promise<BackendProfile | null> => {
    if (backendProfile) {
      if (backendProfile.role !== requestedRole || (requestedRole === 'staff' && backendProfile.service !== requestedService)) {
        Alert.alert('Rôle déjà associé', 'Votre compte possède déjà un rôle ou un service différent. Contactez le gestionnaire pour le modifier.');
        return null;
      }
      if (backendProfile.residence_id) return backendProfile;
    }
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      Alert.alert('Connexion requise', 'Reconnectez-vous pour continuer.');
      return null;
    }
    const fullName = oauthName.trim() || account.profile?.name?.trim() || authData.user.email?.split('@')[0] || '';
    const { data, error } = await supabase.rpc('register_residence_profile', {
      p_full_name: fullName,
      p_residence_name: residence,
      p_requested_role: requestedRole,
      p_service: requestedService,
    });
    if (error) {
      Alert.alert('Inscription impossible', error.message);
      return null;
    }
    const profile = data as BackendProfile;
    if (!profile?.id) {
      Alert.alert('Inscription impossible', 'Le serveur n’a pas renvoyé votre profil.');
      return null;
    }
    setBackendProfile(profile);
    return profile;
  };

  const submitReport = async () => {
    if (!reportSubject) { Alert.alert('Choisissez un sujet', 'Sélectionnez un sujet pour votre signalement.'); return; }
    const details = report.trim();
    if (!details) { Alert.alert('Un détail est nécessaire', 'Décrivez brièvement le problème avant l’envoi.'); return; }
    if (reportSending) return;
    setReportSending(true);
    let uploadedPhoto: string | null = null;
    try {
      const profile = backendProfile ?? await registerResidenceProfile('student');
      if (!profile) return;
      if (profile.role !== 'student' || profile.role_status !== 'active') {
        Alert.alert('Compte étudiant requis', 'Seuls les comptes étudiants peuvent envoyer un signalement.');
        return;
      }
      if (reportPhoto) uploadedPhoto = await uploadPhoto(profile.id, reportPhoto);
      const { error } = await supabase.from('reports').insert({
        student_id: profile.id,
        residence_id: profile.residence_id,
        service,
        subject: reportSubject,
        details,
        photo_path: uploadedPhoto,
      });
      if (error) throw error;
      uploadedPhoto = null;
      setReportPhoto(null);
      Alert.alert('Signalement envoyé', 'Votre demande a été transmise au service concerné.');
      setReportSubject(null);
      setReport('');
      goBack();
    } catch (error) {
      if (uploadedPhoto) void removePhoto(uploadedPhoto);
      Alert.alert('Signalement non envoyé', photoError(error), true);
    } finally { setReportSending(false); }
  };

  const checkStaffApproval = async () => {
    if (!backendProfile?.id) return;
    const { data, error } = await supabase.from('profiles')
      .select('id,full_name,name_last_changed_at,name_changes_used,residence_id,role,service,role_status').eq('id', backendProfile.id).maybeSingle();
    if (error) { Alert.alert('Vérification impossible', error.message); return; }
    if (!data) { Alert.alert('Compte introuvable', 'Reconnectez-vous puis réessayez.'); return; }
    const profile = data as BackendProfile;
    setBackendProfile(profile);
    if (profile.role_status === 'active') { setPage('home'); return; }
    Alert.alert('Toujours en attente', 'Le gestionnaire n’a pas encore validé votre demande.');
  };

  const submitResidenceRating = async (value: number) => {
    const profile = backendProfile;
    if (!profile || profile.role !== 'student') {
      Alert.alert('Connexion requise', 'Connectez-vous avec votre compte étudiant pour enregistrer une note.');
      return;
    }
    setRating(value);
    const { error } = await supabase.from('residence_ratings').upsert({
      user_id: profile.id,
      residence_id: profile.residence_id,
      rating: value,
    }, { onConflict: 'user_id,residence_id' });
    if (error) Alert.alert('Note non enregistrée', error.message, true);
  };

  React.useEffect(() => {
    if (!backendProfile || backendProfile.role !== 'student') { if (!backendProfile || backendProfile.role === 'student') setRequests([]); return; }
    let alive = true;
    const loadStudentRequests = async () => {
      const { data, error } = await supabase.from('reports')
        .select('id,subject,service,residence_id,created_at,status,admin_replied_at')
        .eq('student_id', backendProfile.id).order('created_at', { ascending: false }).limit(10);
      if (!alive) return;
      if (error) { Alert.alert('Impossible de charger vos demandes', error.message, true); return; }
      setRequests((data ?? []).map(row => ({ id: row.id, title: row.subject, service: row.service,
        residence: backendProfile.residence_id, createdAt: Date.parse(row.created_at),
        status: row.status === 'done' ? 'done' : 'queued',
        adminRepliedAt: row.admin_replied_at ? Date.parse(row.admin_replied_at) : null,
      })));
    };
    void loadStudentRequests();
    const channel = supabase.channel(`student-dashboard-${backendProfile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `student_id=eq.${backendProfile.id}` }, () => { void loadStudentRequests(); })
      .subscribe();
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, [backendProfile?.id, backendProfile?.role, backendProfile?.residence_id]);

  React.useEffect(() => {
    if (!backendProfile || backendProfile.role !== 'student') { setRating(0); return; }
    let alive = true;
    void supabase.from('residence_ratings').select('rating')
      .eq('user_id', backendProfile.id).eq('residence_id', backendProfile.residence_id).maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) console.warn('Could not load residence rating:', error.message);
        else setRating(data?.rating ?? 0);
      });
    return () => { alive = false; };
  }, [backendProfile?.id, backendProfile?.residence_id, backendProfile?.role]);

  const signOut = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from('push_tokens').delete().eq('user_id', data.user.id);
    }
    const { error } = await supabase.auth.signOut();
    if (error) { Alert.alert('Déconnexion impossible', error.message); return; }
    setBackendProfile(null);
    setOauthName('');
    setRole('student');
    setStaffAssignment(null);
    setPage('welcome');
  };

  const roleLabel = useMemo(() => role === 'student' ? 'Étudiant·e' : role === 'manager' ? 'Gestionnaire' : 'Responsable de service', [role]);
  const startRole = (next: Role) => { setRole(next); setPage('signin'); };

  const onSwipeEnd = (endX: number, endY: number) => {
    const pages: Page[] = ['home', 'inbox', 'profile'];
    const current = pages.indexOf(page);
    const delta = (endX - touchStartX.current) * (rtl ? -1 : 1);
    if (current < 0 || Math.abs(delta) < 90 || Math.abs(endY - touchStartY.current) > Math.abs(delta) * .65) return;
    const nextIndex = Math.max(0, Math.min(pages.length - 1, current + (delta < 0 ? 1 : -1)));
    setPage(pages[nextIndex]);
  };

  return <SafeAreaView style={[styles.root, { direction: rtl ? 'rtl' : 'ltr' }]} onTouchStart={event => { touchStartX.current = event.nativeEvent.pageX; touchStartY.current = event.nativeEvent.pageY; }} onTouchEnd={event => onSwipeEnd(event.nativeEvent.pageX, event.nativeEvent.pageY)}>
    <StatusBar style="dark" hidden={false} />
    {online !== true ? <OfflineScreen onRetry={retryConnection} checking={checkingConnection} /> : <>
    <ScreenTransition screen={page} rtl={rtl}>
    {page === 'welcome' && <ScrollView contentContainerStyle={styles.welcomeScroll}>
      <GreenCard large style={styles.hero}>
        <View style={styles.heroTop}><View style={styles.brandMark}><AppLogo size={38} /></View><Text style={styles.brandText}>STC <Text style={{ color: C.lime }}>RÉSIDENCE</Text></Text><View style={{ marginStart: 'auto' }}><LanguageSwitch light /></View></View>

        <View style={styles.heroCopy}><Tag color={C.lime} bg="rgba(255,255,255,.12)">ESPACE RÉSIDENT</Tag><Text style={styles.heroTitle}>Votre résidence,{ '\n' }plus proche.</Text><Text style={styles.heroSubtitle}>Un seul endroit pour signaler, suivre et améliorer votre quotidien.</Text></View>
        <View style={styles.heroArt}><View style={styles.sun} /><View style={styles.building}><View style={styles.buildingRoof} /><View style={styles.buildingBody}><View style={styles.windowRow}><View style={styles.window} /><View style={styles.window} /><View style={styles.window} /></View><View style={styles.door} /></View></View><View style={styles.heroBadge}><Text style={{ color: C.dark, fontSize: 12, fontWeight: '800' }}>OUARGLA</Text><Text style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>11 résidences · un lien</Text></View></View>
      </GreenCard>
      <View style={styles.welcomeBody}><Text style={styles.eyebrow}>BIENVENUE SUR STC RÉSIDENCE</Text><Text style={styles.chooseTitle}>Comment souhaitez-vous continuer ?</Text><Text style={styles.chooseHint}>Choisissez votre espace pour accéder aux services de votre résidence.</Text>
        <Pressable onPress={() => startRole('student')} style={({ pressed }) => [styles.roleCard, pressed && styles.pressed]}><View style={[styles.roleIcon, { backgroundColor: '#E8F5ED' }]}><StudentIcon width={27} height={27} /></View><View style={styles.roleCopy}><Text style={styles.roleTitle}>Je suis étudiant·e</Text><Text style={styles.roleDesc}>Signaler un problème, suivre mes demandes</Text></View><Text style={styles.arrow}>↗</Text></Pressable>
        <Pressable onPress={() => startRole('staff')} style={({ pressed }) => [styles.roleCard, pressed && styles.pressed]}><View style={[styles.roleIcon, { backgroundColor: '#EEF1FA' }]}><TeamIcon width={25} height={25} /></View><View style={styles.roleCopy}><Text style={styles.roleTitle}>Je travaille en résidence</Text><Text style={styles.roleDesc}>Espace responsable ou gestionnaire</Text></View><Text style={styles.arrow}>↗</Text></Pressable>
        <Text style={styles.footerNote}>Une résidence mieux écoutée, chaque jour.</Text>
      </View>
    </ScrollView>}

    {page === 'signin' && <><Header title="Connexion" onBack={goBack} /><View style={styles.centerPage}><View style={styles.bigIcon}><AppLogo size={70} /></View><Text style={styles.pageTitle}>Bienvenue dans votre espace</Text><Text style={styles.bodyMuted}>Connectez-vous pour continuer comme {roleLabel.toLowerCase()}.</Text><Pressable disabled={googleLoading} onPress={signInWithGoogle} style={[styles.googleButton, googleLoading && { opacity: .6 }]}><GoogleIcon width={21} height={21} /><Text style={styles.googleText}>{googleLoading ? 'Connexion…' : 'Continuer avec Google'}</Text></Pressable><Text style={styles.legal}>En continuant, vous acceptez les conditions d’utilisation et la politique de confidentialité de STC Résidence.</Text></View></>}

    {page === 'team' && role === 'manager' && <><Header title="Équipe de résidence" onBack={goBack} /><ScrollView contentContainerStyle={styles.formScroll}><ManagerTeam residenceId={backendProfile?.residence_id ?? ''} /></ScrollView></>}
    {page === 'team' && role === 'staff' && <><Header title="Accès équipe" onBack={goBack} /><View style={styles.centerPage}><View style={[styles.bigIcon, { backgroundColor: '#FFF4E5' }]}><WatchIcon width={27} height={27} /></View><Tag color="#A96718" bg="#FFF1DB">EN ATTENTE DE VALIDATION</Tag><Text style={[styles.pageTitle, { marginTop: 16 }]}>Votre demande est envoyée</Text><Text style={styles.bodyMuted}>Le gestionnaire de la résidence vérifiera votre rôle avant d’ouvrir l’espace équipe.</Text><View style={styles.infoBox}><Text style={styles.infoTitle}>Responsable de service</Text><Text style={styles.infoBody}>{backendProfile?.service ?? 'Votre service'} · {residence}</Text></View><Button title="Vérifier mon accès" onPress={() => { void checkStaffApproval(); }} secondary /><Button title="Se déconnecter" onPress={() => { void signOut(); }} secondary /></View></>}

    {page === 'residence' && <><Header title="Votre résidence" onBack={goBack} /><ScrollView contentContainerStyle={styles.formScroll}><Text style={styles.eyebrow}>{roleLabel.toUpperCase()}</Text><Text style={styles.pageTitle}>Choisissez votre résidence</Text><Text style={styles.bodyMuted}>Les résidences sont affichées par DOU. La première est ouverte pour le lancement.</Text><Text style={styles.sectionLabel}>DOU OUARGLA</Text>{residences.slice(0, 4).map((name, i) => <Pressable key={name} onPress={() => i === 0 ? setResidence(name) : Alert.alert('Bientôt disponible', `${name} sera ajoutée prochainement.`)} style={[styles.listRow, residence === name && styles.listRowActive]}><View style={[styles.resIcon, residence === name && { backgroundColor: C.green }]}><Text style={{ color: residence === name ? 'white' : C.green, fontWeight: '800' }}>{i === 0 ? '01' : `0${i + 1}`}</Text></View><View style={{ flex: 1 }}><Text style={styles.listTitle}>{name}</Text><Text style={styles.listSub}>{i === 0 ? 'Résidence garçons · Ouargla' : 'Ouverture prochaine'}</Text></View>{i === 0 ? <Text style={styles.check}>{residence === name ? '✓' : '○'}</Text> : <Tag color="#87918B" bg="#F0F3F1">Bientôt</Tag>}</Pressable>)}<Text style={styles.sectionLabel}>DOU OUARGLA-PÔLE</Text>{residences.slice(4).map((name, i) => <Pressable key={name} onPress={() => Alert.alert('Bientôt disponible', `${name} sera ajoutée prochainement.`)} style={styles.listRow}><View style={styles.resIcon}><Text style={{ color: C.green, fontWeight: '800' }}>{`0${i + 5}`}</Text></View><View style={{ flex: 1 }}><Text style={styles.listTitle}>{name}</Text><Text style={styles.listSub}>Ouverture prochaine</Text></View><Tag color="#87918B" bg="#F0F3F1">Bientôt</Tag></Pressable>)}<Button title="Continuer" onPress={continueResidence} /></ScrollView></>}

    {page === 'services' && <><Header title="Choisir un service" onBack={goBack} /><ScrollView contentContainerStyle={styles.formScroll}><View style={styles.residenceSummary}><HouseIcon width={23} height={23} /><View><Text style={styles.listTitle}>{residence}</Text><Text style={styles.listSub}>Ouargla · {roleLabel}</Text></View></View><Text style={styles.pageTitle}>Quel service souhaitez-vous joindre ?</Text><Text style={styles.bodyMuted}>Chaque signalement sera transmis à l’équipe concernée.</Text>{services.filter(item => role !== 'staff' || !staffAssignment || item.name === staffAssignment.service).map((item) => <Pressable key={item.name} onPress={() => selectService(item.name)} style={({ pressed }) => [styles.serviceRow, pressed && styles.pressed]}><View style={[styles.serviceIcon, { backgroundColor: item.tint }]}><item.icon width={24} height={24} /></View><View style={{ flex: 1 }}><Text style={styles.listTitle}>{item.name}</Text><Text style={styles.listSub}>{item.caption}{language === 'fr' ? ` · ${item.ar}` : ''}</Text></View><Text style={styles.arrow}>›</Text></Pressable>)}</ScrollView></>}

    {page === 'report' && !isStaff && <><Header title="Nouveau signalement" onBack={goBack} /><ScrollView contentContainerStyle={styles.formScroll}><Tag>{service.toUpperCase()}</Tag><Text style={[styles.pageTitle, { marginTop: 14 }]}>Dites-nous ce qui se passe.</Text><Text style={styles.bodyMuted}>Votre signalement sera transmis au service {service.toLowerCase()} de {residence}.</Text><Text style={styles.sectionLabel}>SUJET</Text><View style={styles.chipWrap}>{['Propreté', 'Équipement', 'Qualité', 'Autre'].map(x => { const active = reportSubject === x; return <Pressable key={x} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => setReportSubject(x)} style={[styles.choiceChip, active && styles.chipSelected]}><Text style={[styles.choiceText, active && { color: C.green, fontWeight: '800' }]}>{active ? '✓  ' : ''}{x}</Text></Pressable>; })}</View><Text style={styles.sectionLabel}>DÉTAILS</Text><TextInput value={report} onChangeText={setReport} multiline placeholder="Décrivez le problème et indiquez où il se trouve…" placeholderTextColor="#A1ADA6" style={styles.textArea} /><Text style={styles.sectionLabel}>PHOTO (FACULTATIF)</Text><ReportPhotoPicker value={reportPhoto} onChange={setReportPhoto} disabled={reportSending} /><Button title={reportSending ? 'Envoi…' : 'Envoyer le signalement  →'} onPress={() => { void submitReport(); }} /></ScrollView></>}

    {page === 'inbox' && <><Header title={role === 'student' ? 'Mes signalements' : 'Boîte de réception'} /><ScrollView contentContainerStyle={styles.formScroll}><ResidenceInbox role={role} residenceId={backendProfile?.residence_id ?? ''} service={role === 'staff' ? backendProfile?.service ?? service : null} userId={backendProfile?.id ?? ''} /></ScrollView></>}

    {page === 'profile' && <><Header title="Mon espace" /><ScrollView contentContainerStyle={styles.formScroll}><View style={styles.profileHero}><ProfilePhoto key={avatarRevision} userId={backendProfile?.id ?? ""} avatarOnly /><View style={{ flex: 1 }}><Text raw={Boolean(account.profile)} style={styles.listTitle}>{account.profile?.name || oauthName || 'Mon compte'}</Text><Text style={styles.listSub}>{roleLabel} · {residence}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={rtl ? 'تعديل الاسم' : 'Modifier le nom'} onPress={() => setEditingName(true)} style={{ padding: 10 }}><EditIcon width={19} height={19} /></Pressable></View><MajorUpdates userId={backendProfile?.id ?? ""} installedVersion={Updates?.runtimeVersion ?? Constants.expoConfig?.version ?? ""} refreshKey={releaseRefreshKey} /><Text style={styles.sectionLabel}>MON COMPTE</Text><View style={styles.settingsCard}><Pressable style={styles.settingsRow} onPress={() => setEditingName(value => !value)}><View style={styles.settingsIcon}><EditIcon width={17} height={17} /></View><Text style={styles.settingsText}>Informations personnelles</Text><Text style={styles.arrow}>›</Text></Pressable>{editingName && <ProfileNameEditor account={account} onClose={() => setEditingName(false)} />}<ProfilePhoto userId={backendProfile?.id ?? ""} onSaved={() => setAvatarRevision(value => value + 1)} /><Pressable accessibilityRole="button" style={styles.settingsRow} onPress={updateStatus === 'ready' && Updates ? () => { void Updates.reloadAsync(); } : checkForAppUpdate}><View style={styles.settingsIcon}><WatchIcon width={17} height={17} /></View><View style={{ flex: 1 }}><Text style={styles.settingsText}>{updateStatus === 'ready' ? 'Installer la mise à jour' : 'Vérifier les mises à jour'}</Text><Text style={styles.listSub}>{updateStatus === 'checking' ? 'Vérification…' : updateStatus === 'ready' ? 'Mise à jour téléchargée · redémarrer' : 'Version de l’application'}</Text></View><Text style={styles.arrow}>›</Text></Pressable><View style={styles.settingsRow}><View style={styles.settingsIcon}><WatchIcon width={17} height={17} /></View><View style={{ flex: 1 }}><Text style={styles.settingsText}>Changement de rôle</Text><Text style={styles.listSub}>Disponible dans 14 jours</Text></View><Tag color="#8A7550" bg="#F8F1E6">14 j</Tag></View></View><Text style={styles.sectionLabel}>DÉCOUVRIR STC</Text><View style={styles.settingsCard}>{['STC Officiel', 'Projets STC', 'À propos de l’application'].map((x, i) => <Pressable key={x} style={styles.settingsRow} onPress={() => Alert.alert(x, i === 0 ? 'stc-official.netlify.app' : 'Découvrez les projets de STC.')}><View style={styles.settingsIcon}>{i === 0 ? <ShareIcon width={17} height={17} /> : i === 1 ? <TeamIcon width={17} height={17} /> : <HouseIcon width={17} height={17} />}</View><Text style={styles.settingsText}>{x}</Text><Text style={styles.arrow}>›</Text></Pressable>)}</View><Button title="Se déconnecter" onPress={() => { void signOut(); }} secondary /></ScrollView></>}

    {page === 'home' && <><Header title={isStaff ? 'Espace service' : 'Accueil'} right={<Pressable style={styles.headerBubble} onPress={() => setPage('inbox')}><MessagesIcon width={19} height={19} /></Pressable>} /><ScrollView contentContainerStyle={styles.homeScroll}>
      {isStaff && role === 'staff' && <View style={styles.pendingStrip}></View>}
      <View style={styles.greeting}><View><Text style={styles.greetingSmall}>{isStaff ? `TABLEAU DE BORD · ${service.toUpperCase()}` : new Date().toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text><Text raw style={styles.greetingTitle}>{isStaff ? (rtl ? 'مرحبًا بالفريق' : 'Bonjour, l’équipe') : `${rtl ? 'مرحبًا' : 'Bonjour'}${oauthName ? `, ${oauthName}` : account.profile ? `, ${account.profile.name}` : ''}`}</Text></View><View style={styles.avatarSmall}><UserIcon width={23} height={23} /></View></View>
      <GreenCard style={styles.homeHero}><View style={{ flex: 1 }}><Tag color={C.lime} bg="rgba(255,255,255,.12)">{residence.toUpperCase()}</Tag><Text style={styles.homeHeroTitle}>{isStaff ? 'Les demandes, à portée de main.' : 'Un petit geste peut améliorer la vie de tous.'}</Text><Text style={styles.homeHeroSub}>{isStaff ? 'Consultez les demandes de votre service.' : 'Votre voix compte dans votre résidence.'}</Text></View></GreenCard>
      {role === 'manager' && <ManagerRequests role={role} residence={residence} requests={requests} />}
      {isStaff ? <ServiceRequests access={requestAccess} requests={requests} onOpenInbox={() => setPage('inbox')} /> : <><View style={styles.sectionHead}><Text style={styles.sectionTitle}>Signaler un problème</Text><Text style={styles.stepHint}>1 / 3</Text></View><View style={styles.serviceGrid}>{services.map(item => <Pressable key={item.name} onPress={() => { setService(item.name); setPage('report'); }} style={({ pressed }) => [styles.serviceTile, pressed && { transform: [{ scale: .975 }], backgroundColor: C.mint }]}><View style={[styles.tileIcon, { backgroundColor: item.tint }]}><item.icon width={22} height={22} /></View><Text style={styles.tileTitle}>{item.name}</Text><Text style={styles.tileSub}>{item.caption}</Text></Pressable>)}</View><View style={styles.sectionHead}><Text style={styles.sectionTitle}>Mes demandes</Text><Pressable onPress={() => setPage('inbox')}><Text style={styles.seeAll}>Tout voir →</Text></Pressable></View>{requests[0] ? <Pressable onPress={() => setPage('inbox')} style={styles.reportCard}><View style={styles.cardTop}><Tag color={requests[0].status === 'done' ? C.green : '#A96718'} bg={requests[0].status === 'done' ? C.mint : '#FFF1DB'}>{requests[0].status === 'done' ? 'TERMINÉ' : requests[0].adminRepliedAt ? 'EN COURS' : 'EN ATTENTE'}</Tag><Text raw style={styles.time}>{new Date(requests[0].createdAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}</Text></View><Text raw style={[styles.listTitle, { marginTop: 12 }]}>{requests[0].title}</Text><Text style={styles.reportExcerpt}>{requests[0].service}</Text></Pressable> : <View style={styles.emptyCard}><View style={styles.emptyIcon}><Text style={{ color: C.green, fontSize: 22 }}>✓</Text></View><View style={{ flex: 1 }}><Text style={styles.listTitle}>Tout est à jour</Text><Text style={styles.listSub}>Vos nouvelles demandes apparaîtront ici.</Text></View></View>}<View style={styles.rateCard}><View style={{ flex: 1 }}><View style={styles.rateHeading}><MedalIcon width={20} height={20} /><Text style={styles.rateTitle}>Comment se passe la vie ici ?</Text></View><Text style={styles.rateSub}>Évaluez votre résidence</Text></View><View style={styles.stars}>{[1,2,3,4,5].map(n => <Pressable onPress={() => { void submitResidenceRating(n); }} key={n}><Text style={{ fontSize: 22, color: n <= rating ? '#EAA84A' : '#D5DDD7' }}>★</Text></Pressable>)}</View></View></>}
      {role === 'manager' && <View style={styles.quickGrid}><Pressable style={styles.quickCard} onPress={() => setPage('team')}><View style={styles.quickIcon}><TeamIcon width={21} height={21} /></View><Text style={styles.quickTitle}>Équipe</Text><Text style={styles.quickSub}>Demandes de rôles</Text></Pressable><Pressable style={styles.quickCard} onPress={() => setPage('team')}><View style={styles.quickIcon}><UserIcon width={21} height={21} /></View><Text style={styles.quickTitle}>Utilisateurs</Text><Text style={styles.quickSub}>Accès & modération</Text></Pressable></View>}
      {role === 'manager' && <ManagerAnnouncements residenceId={backendProfile?.residence_id ?? ''} />}
      <Pressable onPress={() => { setPage('profile'); }} style={styles.webLink}><Text style={{ color: C.green, fontWeight: '700' }}>Découvrir STC →</Text><Text style={{ color: C.muted, fontSize: 12 }}> stc-official.netlify.app</Text></Pressable>
    </ScrollView></>}

    </ScreenTransition>
    {['home','inbox','profile'].includes(page) && <BottomNavigation items={navItems} selected={tab} onSelect={index => setPage((['home', 'inbox', 'profile'] as const)[index])} />}
    </>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas }, welcomeScroll: { flexGrow: 1, backgroundColor: C.white },
  hero: { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, minHeight: 430, backgroundColor: C.dark, paddingHorizontal: 25, paddingTop: 18, overflow: 'hidden', position: 'relative' }, heroTop: { flexDirection: 'row', alignItems: 'center', zIndex: 2 }, brandMark: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginEnd: 10 }, brandDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: C.green, right: 4, top: 4 }, brandText: { color: 'white', fontWeight: '800', letterSpacing: 1, fontSize: 13 }, languageButton: { marginStart: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.1)' }, lang: { color: '#D6E9DF', fontWeight: '700', fontSize: 11 }, langChevron: { color: '#D6E9DF', fontSize: 12, marginTop: -2 }, orbitOne: { position: 'absolute', width: 340, height: 340, borderRadius: 200, borderWidth: 1, borderColor: 'rgba(185,237,119,.16)', top: 75, right: -145 }, orbitTwo: { position: 'absolute', width: 260, height: 260, borderRadius: 150, borderWidth: 1, borderColor: 'rgba(185,237,119,.14)', top: 125, right: -90 }, heroCopy: { marginTop: 38, zIndex: 2 }, heroTitle: { color: 'white', fontSize: 36, lineHeight: 40, fontWeight: '800', letterSpacing: -.7, marginTop: 15 }, heroSubtitle: { color: '#BED2C7', fontSize: 14, lineHeight: 21, maxWidth: 300, marginTop: 10 }, heroArt: { height: 128, marginTop: 12, position: 'relative', alignItems: 'center' }, sun: { width: 82, height: 82, borderRadius: 45, backgroundColor: 'rgba(185,237,119,.18)', position: 'absolute', top: 6, right: 72 }, building: { alignItems: 'center', position: 'absolute', bottom: -6, left: 30 }, buildingRoof: { width: 126, height: 26, backgroundColor: '#B9ED77', transform: [{ skewX: '-25deg' }], borderTopLeftRadius: 5, borderTopRightRadius: 7 }, buildingBody: { width: 128, height: 78, backgroundColor: '#E8F4EA', borderTopWidth: 4, borderColor: '#8BCB65', alignItems: 'center', paddingTop: 10 }, windowRow: { flexDirection: 'row', gap: 12 }, window: { width: 18, height: 22, backgroundColor: '#6BA984', borderRadius: 4 }, door: { position: 'absolute', bottom: 0, left: 52, width: 25, height: 40, backgroundColor: '#2A7954', borderTopLeftRadius: 12, borderTopRightRadius: 12 }, heroBadge: { position: 'absolute', right: 0, bottom: 28, backgroundColor: 'white', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 14, shadowColor: '#000', shadowOpacity: .12, shadowRadius: 12, elevation: 5 }, welcomeBody: { padding: 24, paddingTop: 28 }, eyebrow: { color: C.green, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 }, chooseTitle: { fontSize: 22, fontWeight: '800', color: C.ink, marginTop: 8 }, chooseHint: { color: C.muted, fontSize: 13, lineHeight: 20, marginTop: 6, marginBottom: 20 }, roleCard: { backgroundColor: 'white', borderRadius: 19, borderWidth: 1, borderColor: C.line, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 11 }, pressed: { transform: [{ scale: .985 }], opacity: .86 }, roleIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginEnd: 12 }, roleCopy: { flex: 1 }, roleTitle: { fontSize: 15, fontWeight: '800', color: C.ink }, roleDesc: { color: C.muted, fontSize: 11, marginTop: 4 }, arrow: { color: '#96A49B', fontSize: 22, paddingHorizontal: 5 }, footerNote: { textAlign: 'center', color: '#A2ADA6', fontSize: 11, marginTop: 14, marginBottom: 18 },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, backgroundColor: C.canvas }, logoMini: { width: 32, height: 32, borderRadius: 11, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center', marginEnd: 11 }, headerTitle: { flexShrink: 1, fontSize: 17, fontWeight: '800', color: C.ink }, back: { width: 36, height: 36, borderRadius: 13, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginEnd: 10, borderWidth: 1, borderColor: C.line }, backText: { fontSize: 28, lineHeight: 30, color: C.dark }, headerBubble: { width: 38, height: 38, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
  centerPage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }, bigIcon: { width: 70, height: 70, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: C.mint, marginBottom: 22 }, pageTitle: { color: C.ink, fontSize: 25, lineHeight: 31, fontWeight: '800', marginBottom: 8 }, bodyMuted: { color: C.muted, fontSize: 14, lineHeight: 21, marginBottom: 21 }, googleButton: { width: '100%', height: 54, borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12, marginTop: 18 }, googleText: { color: C.ink, fontWeight: '700', fontSize: 14 }, legal: { textAlign: 'center', color: '#9AA59E', fontSize: 11, lineHeight: 17, marginTop: 22 }, infoBox: { width: '100%', borderRadius: 16, backgroundColor: '#F2F7F3', padding: 15, marginVertical: 18 }, infoTitle: { fontWeight: '800', color: C.ink, fontSize: 14 }, infoBody: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }, demoHint: { color: '#9AA59E', textAlign: 'center', fontSize: 10, lineHeight: 15, marginTop: 18 },
  formScroll: { padding: 22, paddingBottom: 44 }, sectionLabel: { color: '#89968E', fontSize: 10, letterSpacing: 1.2, fontWeight: '800', marginTop: 21, marginBottom: 10 }, listRow: { minHeight: 68, borderRadius: 16, padding: 11, borderWidth: 1, borderColor: C.line, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', marginBottom: 9 }, listRowActive: { borderColor: C.green, backgroundColor: '#F5FBF7' }, resIcon: { width: 41, height: 41, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.mint, marginEnd: 11 }, listTitle: { color: C.ink, fontWeight: '800', fontSize: 14 }, listSub: { color: C.muted, fontSize: 11, marginTop: 4 }, check: { color: C.green, fontSize: 21, marginHorizontal: 5 }, button: { minHeight: 52, borderRadius: 16, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 20 }, buttonText: { color: 'white', fontSize: 14, fontWeight: '800' }, buttonSecondary: { backgroundColor: 'white', borderWidth: 1, borderColor: C.line }, buttonSecondaryText: { color: C.dark }, buttonSmall: { minHeight: 37, borderRadius: 12, marginTop: 0, paddingHorizontal: 12 }, residenceSummary: { backgroundColor: 'white', borderWidth: 1, borderColor: C.line, borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 }, tag: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8 }, serviceRow: { borderRadius: 17, borderWidth: 1, borderColor: C.line, backgroundColor: 'white', padding: 13, flexDirection: 'row', alignItems: 'center', marginTop: 10 }, serviceIcon: { width: 47, height: 47, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginEnd: 12 },
  homeScroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 110 }, greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 9, marginBottom: 17 }, greetingSmall: { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 }, greetingTitle: { fontSize: 22, fontWeight: '800', color: C.ink, marginTop: 5 }, avatarSmall: { width: 40, height: 40, borderRadius: 15, backgroundColor: '#DDF0E3', alignItems: 'center', justifyContent: 'center' }, homeHero: { minHeight: 176, backgroundColor: C.dark, borderRadius: 27, padding: 23, overflow: 'hidden', flexDirection: 'row', marginBottom: 23 }, homeHeroBlob: { position: 'absolute', width: 190, height: 190, borderRadius: 100, backgroundColor: 'rgba(185,237,119,.08)', right: -50, top: -45 }, homeHeroTitle: { color: '#FFFFFF', fontSize: 22, lineHeight: 29, fontWeight: '800', maxWidth: 275, marginTop: 15 }, homeHeroSub: { color: '#D1EBDD', fontSize: 12, lineHeight: 19, marginTop: 9, maxWidth: 275 }, sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 12 }, sectionTitle: { color: C.ink, fontSize: 16, fontWeight: '800' }, seeAll: { color: C.green, fontSize: 11, fontWeight: '800' }, stepHint: { color: C.muted, fontSize: 11 }, serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 19 }, serviceTile: { width: '48.5%', backgroundColor: 'white', borderRadius: 18, borderWidth: 1, borderColor: C.line, padding: 13, marginBottom: 9 }, tileIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 9 }, tileTitle: { color: C.ink, fontWeight: '800', fontSize: 13 }, tileSub: { color: C.muted, fontSize: 10, marginTop: 4 }, emptyCard: { borderRadius: 18, backgroundColor: 'white', borderWidth: 1, borderColor: C.line, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 13 }, emptyIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center', marginEnd: 11 }, rateCard: { backgroundColor: '#EDF8EE', borderWidth: 1, borderColor: '#D4EACD', borderRadius: 18, padding: 14, marginTop: 4, marginBottom: 14 }, rateHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 }, rateTitle: { fontSize: 14, color: C.ink, fontWeight: '800' }, rateSub: { fontSize: 11, color: C.muted, marginTop: 3 }, stars: { flexDirection: 'row', marginTop: 9, gap: 7 }, webLink: { flexDirection: 'row', marginTop: 14, marginBottom: 8, alignItems: 'center' },
  reportCard: { backgroundColor: 'white', borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 15, marginBottom: 12 }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, time: { color: '#9AA59E', fontSize: 10 }, reportExcerpt: { color: '#67756D', fontSize: 12, lineHeight: 18, marginTop: 10 }, cardLink: { color: C.green, fontWeight: '800', fontSize: 12, marginTop: 13 }, cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 13 }, moderateLink: { color: '#9D4B4B', fontSize: 11, fontWeight: '700' }, metricRow: { flexDirection: 'row', gap: 9, marginBottom: 20 }, metric: { flex: 1, backgroundColor: 'white', borderColor: C.line, borderWidth: 1, borderRadius: 16, padding: 12 }, metricNum: { color: C.green, fontWeight: '900', fontSize: 22 }, metricLabel: { color: C.muted, fontSize: 10, marginTop: 3 }, quickGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 }, quickCard: { flex: 1, borderRadius: 17, backgroundColor: 'white', borderWidth: 1, borderColor: C.line, padding: 13 }, quickIcon: { width: 24, height: 24, marginBottom: 8, alignItems: 'center', justifyContent: 'center' }, quickTitle: { fontWeight: '800', color: C.ink, fontSize: 12 }, quickSub: { color: C.muted, fontSize: 10, marginTop: 3 }, pendingStrip: { backgroundColor: '#FFF4E2', borderRadius: 11, padding: 9, marginBottom: 12 }, managerBox: { backgroundColor: 'white', borderRadius: 19, padding: 15, borderWidth: 1, borderColor: C.line, marginTop: 12 }, announceInput: { backgroundColor: C.canvas, minHeight: 70, textAlignVertical: 'top', borderRadius: 13, padding: 12, marginTop: 12, color: C.ink },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choiceChip: { borderWidth: 1, borderColor: C.line, backgroundColor: 'white', borderRadius: 11, paddingHorizontal: 12, paddingVertical: 9 }, chipSelected: { borderColor: C.green, backgroundColor: C.mint }, choiceText: { color: C.dark, fontSize: 11, fontWeight: '700' }, textArea: { minHeight: 132, backgroundColor: 'white', borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 14, textAlignVertical: 'top', color: C.ink, fontSize: 13 }, upload: { height: 66, borderWidth: 1, borderStyle: 'dashed', borderColor: '#B7C8BD', backgroundColor: '#FBFDFC', borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, uploadText: { color: C.green, fontSize: 12, fontWeight: '700' }, profileHero: { backgroundColor: 'white', borderWidth: 1, borderColor: C.line, borderRadius: 19, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }, avatar: { width: 54, height: 54, borderRadius: 20, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }, settingsCard: { backgroundColor: 'white', borderWidth: 1, borderColor: C.line, borderRadius: 17, paddingHorizontal: 13, marginBottom: 7 }, settingsRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEF2EF', gap: 10 }, settingsIcon: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center' }, settingsText: { color: C.ink, fontSize: 12, fontWeight: '700', flex: 1 }, bottomWrap: { position: 'absolute', left: 22, right: 22, bottom: 13 }, bottomBar: { height: 64, borderRadius: 24, backgroundColor: 'rgba(255,255,255,.96)', borderWidth: 1, borderColor: '#E2EBE4', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 7, shadowColor: '#183A29', shadowOpacity: .12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 }, navItem: { minWidth: 88, height: 49, alignItems: 'center', justifyContent: 'center', borderRadius: 18 }, navItemActive: { backgroundColor: C.mint }, navText: { fontSize: 9, color: '#98A69D', marginTop: 2 }, navTextActive: { color: C.green, fontWeight: '800' },
});
