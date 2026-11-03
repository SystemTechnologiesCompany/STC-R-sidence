import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, View } from 'react-native';
import { Text, useLanguage } from './i18n';
import { supabase } from './supabase';

type ServiceScore = { service: string; average: number | null; votes: number; mine: number | null };
type ResidenceScore = { id: string; name: string; average: number | null; votes: number; rated_services: number };
type Summary = { services: ServiceScore[]; residences: ResidenceScore[] };

export function ServiceRatings({ userId, residenceId, canRate }: { userId: string; residenceId: string; canRate: boolean }) {
  const { rtl, language } = useLanguage();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const busy = useRef(false);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    if (!userId) { setSummary(null); return; }
    setLoading(true); setError(null);
    try {
      const { data, error: queryError } = await supabase.rpc('get_residence_rating_summary');
      if (queryError) throw queryError;
      if (request === generation.current) setSummary(data as Summary);
    } catch (failure) {
      if (request === generation.current) setError(failure && typeof failure === 'object' && 'message' in failure ? String(failure.message) : 'Impossible de charger les notes.');
    } finally { if (request === generation.current) setLoading(false); }
  }, [userId, residenceId]);

  useEffect(() => { setSummary(null); void refresh(); return () => { generation.current++; }; }, [refresh]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => listener.remove();
  }, [refresh]);

  const rate = async (service: string, value: number) => {
    if (!canRate || busy.current) return;
    busy.current = true; setSaving(service); setError(null);
    try {
      const { error: saveError } = await supabase.rpc('rate_my_residence_service', { p_service: service, p_rating: value });
      if (saveError) throw saveError;
      await refresh();
    } catch (failure) { setError(failure && typeof failure === 'object' && 'message' in failure ? String(failure.message) : 'Impossible d’enregistrer la note.'); }
    finally { busy.current = false; setSaving(null); }
  };
  const score = (value: number | null) => value === null ? (rtl ? 'لا توجد تقييمات' : 'Pas encore de note') : `${value.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { maximumFractionDigits: 2 })} / 5`;
  const ownResidence = summary?.residences.find(item => item.id === residenceId);
  if (!userId) return null;
  return <View style={styles.wrap}>
    <Text raw style={styles.title}>{rtl ? 'تقييم مصالح إقامتك' : 'Les services de votre résidence'}</Text>
    {ownResidence && <View style={styles.total}><Text raw style={styles.name}>{ownResidence.name}</Text><Text raw style={styles.totalScore}>★ {score(ownResidence.average)}</Text><Text raw style={styles.hint}>{rtl ? `${ownResidence.rated_services} مصالح مقيّمة · ${ownResidence.votes} تقييمات` : `${ownResidence.rated_services} service(s) évalué(s) · ${ownResidence.votes} note(s)`}</Text></View>}
    <Text raw style={styles.hint}>{rtl ? 'تقييم الإقامة هو متوسط تقييمات المصالح، بنفس الوزن لكل مصلحة. المصالح دون تقييم لا تدخل في الحساب.' : 'La note de résidence est la moyenne des notes des services, avec le même poids pour chacun. Les services sans note sont exclus du calcul.'}</Text>
    {canRate && <Text raw style={styles.hint}>{rtl ? 'اضغط على النجوم لتقييم كل مصلحة. يمكنك تعديل تقييمك؛ يحتفظ حسابك بتقييم واحد لكل مصلحة.' : 'Touchez les étoiles pour noter chaque service. Vous pouvez modifier votre note : votre compte garde une seule note par service.'}</Text>}
    {loading && <ActivityIndicator color="#16845A" style={{ padding: 10 }} />}
    {summary?.services.map(service => <View key={service.service} style={styles.card}>
      <View style={styles.row}><Text style={styles.name}>{service.service}</Text><Text raw style={styles.score}>★ {score(service.average)}</Text></View>
      <Text raw style={styles.hint}>{rtl ? `${service.votes} تقييمات` : `${service.votes} note(s)`}</Text>
      {canRate && <View style={styles.stars}>{[1, 2, 3, 4, 5].map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={rtl ? `${service.service}: ${value} من 5` : `${service.service} : ${value} sur 5`} accessibilityState={{ selected: value === service.mine, disabled: saving !== null }} disabled={saving !== null} onPress={() => { void rate(service.service, value); }} style={styles.starButton}><Text raw style={[styles.star, { color: value <= (service.mine ?? 0) ? '#D99425' : '#CCD8D0' }]}>★</Text></Pressable>)}{saving === service.service && <ActivityIndicator color="#16845A" />}</View>}
      {canRate && <Text raw style={styles.hint}>{rtl ? `تقييمك: ${service.mine === null ? 'لم تقيّم بعد' : `${service.mine} / 5`}` : `Votre note : ${service.mine === null ? 'pas encore évalué' : `${service.mine} / 5`}`}</Text>}
    </View>)}
    {!!error && <Text raw accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <View style={styles.row}><Text raw style={styles.title}>{rtl ? 'تقييمات جميع الإقامات' : 'Notes de toutes les résidences'}</Text><Pressable accessibilityRole="button" disabled={loading || saving !== null} onPress={() => { void refresh(); }}><Text raw style={styles.refresh}>{rtl ? 'تحديث' : 'Actualiser'}</Text></Pressable></View>
    {summary?.residences.map(residence => <View key={residence.id} style={[styles.residence, residence.id === residenceId && styles.current]}><View style={{ flex: 1 }}><Text raw style={styles.name}>{residence.name}</Text><Text raw style={styles.hint}>{rtl ? `${residence.votes} تقييمات` : `${residence.votes} note(s)`}</Text></View><Text raw style={styles.score}>★ {score(residence.average)}</Text></View>)}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginVertical: 18 },
  title: { color: '#103D2E', fontSize: 16, fontWeight: '800', flexShrink: 1 },
  total: { borderRadius: 20, backgroundColor: '#EAF7F0', padding: 17, gap: 7 },
  totalScore: { color: '#16845A', fontSize: 25, fontWeight: '900' },
  card: { padding: 14, backgroundColor: 'white', borderRadius: 17, borderWidth: 1, borderColor: '#E6EDE8', gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 },
  name: { color: '#18241F', fontSize: 13, fontWeight: '800', flexShrink: 1 },
  score: { color: '#16845A', fontSize: 12, fontWeight: '800', flexShrink: 1 },
  hint: { color: '#78877F', fontSize: 11, lineHeight: 18 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  starButton: { minWidth: 42, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  star: { fontSize: 30 },
  error: { color: '#B13C3C', fontSize: 12, lineHeight: 18 },
  refresh: { color: '#16845A', fontSize: 11, fontWeight: '800', paddingVertical: 10 },
  residence: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 13, backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#E6EDE8' },
  current: { borderColor: '#16845A', backgroundColor: '#F2FAF5' },
});
