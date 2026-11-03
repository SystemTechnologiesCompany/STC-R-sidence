import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';
import { Text, useLanguage } from './i18n';
import { supabase } from './supabase';
import { compareReleaseVersions, validApkUrl } from './releaseVersion';

type Release = { id: string; version: string; title: string; notes: string; download_url: string; created_at: string };

export function MajorUpdates({ installedVersion, refreshKey, userId }: { installedVersion: string; refreshKey: number; userId: string }) {
  const { rtl } = useLanguage();
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const check = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true); setError(null);
    try {
      if (!userId) throw new Error('Connectez-vous pour vérifier les mises à jour.');
      const { data, error: queryError } = await supabase.from('app_releases')
        .select('id,version,title,notes,download_url,created_at').eq('is_major', true)
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      if (request !== generation.current) return;
      if (compareReleaseVersions(installedVersion, installedVersion) === null) throw new Error('Version installée introuvable.');
      const newest = (data as Release[] ?? []).filter(item => compareReleaseVersions(item.version, installedVersion) === 1)
        .sort((a, b) => compareReleaseVersions(b.version, a.version) ?? 0)[0] ?? null;
      setRelease(newest);
    } catch (failure) {
      if (request !== generation.current) return;
      setRelease(null);
      setError(failure && typeof failure === 'object' && 'message' in failure ? String(failure.message) : 'Vérification impossible. Réessayez.');
    } finally { if (request === generation.current) setLoading(false); }
  }, [installedVersion, userId]);

  useEffect(() => { void check(); return () => { generation.current++; }; }, [check, refreshKey]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void check(); });
    return () => listener.remove();
  }, [check]);

  const download = async () => {
    if (!release || opening) return;
    if (!validApkUrl(release.download_url)) {
      setError(rtl ? 'رابط التحديث غير صالح. يجب أن يكون رابط HTTPS مباشرًا لملف APK.' : 'Lien de mise à jour invalide. Un lien HTTPS direct vers le fichier APK est nécessaire.');
      return;
    }
    setOpening(true); setError(null);
    try { await Linking.openURL(release.download_url); }
    catch { setError(rtl ? 'تعذّر فتح التنزيل. أعد المحاولة.' : 'Impossible d’ouvrir le téléchargement. Réessayez.'); }
    finally { setOpening(false); }
  };

  return <View style={styles.card}>
    <View style={styles.heading}><Text raw style={styles.title}>{rtl ? 'تحديثات التطبيق' : 'Mises à jour de l’application'}</Text><Text raw style={styles.version}>v{installedVersion}</Text></View>
    {loading ? <ActivityIndicator color="#16845A" style={{ marginVertical: 15 }} /> : release ? <>
      <Text raw style={styles.badge}>{rtl ? 'إصدار جديد متاح' : 'Nouvelle version disponible'} · {release.version}</Text>
      <Text raw style={styles.releaseTitle}>{release.title}</Text>
      {!!release.notes && <Text raw style={styles.body}>{release.notes}</Text>}
      <Text raw style={styles.body}>{rtl ? 'نزّل ملف APK ثم افتحه واضغط «تحديث». قد يطلب Android السماح بالتثبيت من هذا المصدر.' : 'Téléchargez l’APK, ouvrez le fichier, puis choisissez « Mettre à jour ». Android peut demander d’autoriser l’installation depuis cette source.'}</Text>
      <Pressable accessibilityRole="button" disabled={opening} onPress={() => { void download(); }} style={[styles.button, opening && { opacity: .5 }]}><Text raw style={styles.buttonText}>{opening ? (rtl ? 'جارٍ فتح التنزيل…' : 'Ouverture…') : (rtl ? 'تنزيل التحديث' : 'Télécharger la mise à jour')}</Text></Pressable>
    </> : !error && <Text raw style={styles.body}>{rtl ? 'لديك أحدث إصدار متاح.' : 'Vous utilisez la dernière version disponible.'}</Text>}
    {!!error && <Text raw accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Pressable accessibilityRole="button" disabled={loading} onPress={() => { void check(); }} style={styles.refresh}><Text raw style={styles.refreshText}>{rtl ? 'التحقق من التحديثات' : 'Vérifier les nouvelles versions'}</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 19, borderWidth: 1, borderColor: '#D8E8DE', backgroundColor: '#FFFFFF', marginVertical: 12, gap: 9 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, color: '#103D2E', fontWeight: '800', fontSize: 15 },
  version: { color: '#78877F', fontSize: 11 },
  badge: { color: '#16845A', fontSize: 12, fontWeight: '800', marginTop: 6 },
  releaseTitle: { color: '#18241F', fontWeight: '800', fontSize: 14 },
  body: { color: '#67756D', fontSize: 12, lineHeight: 19 },
  button: { backgroundColor: '#16845A', padding: 14, borderRadius: 13, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '800', fontSize: 13 },
  error: { color: '#B13C3C', fontSize: 12, lineHeight: 18 },
  refresh: { alignItems: 'center', padding: 9 },
  refreshText: { color: '#16845A', fontSize: 12, fontWeight: '700' },
});
