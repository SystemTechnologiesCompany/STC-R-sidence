import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useLanguage, useLocalizedAlert } from './i18n';
import { requestState, type ResidenceRequest } from './requests';

const statuses = {
  done: { label: 'Terminées', color: '#16845A', tint: '#EAF7F0' },
  queued: { label: 'En attente', color: '#D68120', tint: '#FFF3E2' },
  overdue: { label: 'Alerte · 3 jours', color: '#C84242', tint: '#FDEDED' },
};
export function ManagerRequests({ role, residence, requests }: { role: string; residence: string; requests: ResidenceRequest[] }) {
  const [now, setNow] = useState(Date.now);
  const { rtl, language, t } = useLanguage();
  const alert = useLocalizedAlert();
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  if (role !== 'manager') return null;
  const rows = requests.filter(request => request.residence === residence);
  const overdue = rows.filter(request => requestState(request, now) === 'overdue');
  const explain = () => alert.alert('Demandes sans réponse', 'Ces demandes ne sont pas terminées et n’ont reçu aucune réponse administrative depuis au moins 72 heures.');
  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.heading}>Suivi des demandes</Text>
    <Text style={styles.subtitle}>Tous les services de votre résidence</Text>
    <View style={styles.legend}>{(Object.keys(statuses) as (keyof typeof statuses)[]).map(key => <View key={key} style={[styles.metric, { backgroundColor: statuses[key].tint }]}><View style={styles.statusLine}><View style={[styles.dot, { backgroundColor: statuses[key].color }]} /><Text raw style={[styles.count, { color: statuses[key].color }]}>{rows.filter(request => requestState(request, now) === key).length}</Text></View><Text style={styles.label}>{statuses[key].label}</Text></View>)}</View>
    {overdue.length > 0 && <Pressable accessibilityRole="button" onPress={explain} style={styles.alert}><Text raw style={styles.alertIcon}>!</Text><View style={{ flex: 1 }}><Text style={styles.alertTitle}>Demandes sans réponse</Text><Text raw style={styles.alertBody}>{rtl ? `${overdue.length} بلاغات تتطلب المتابعة · اضغط للتفاصيل` : `${overdue.length} demande(s) à relancer · Voir le détail`}</Text></View></Pressable>}
    {rows.some(request => request.demo) && <Text style={styles.demo}>Aperçu · exemples de demandes inclus</Text>}
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: '100%' }}><View style={{ minWidth: 480, flex: 1, direction: rtl ? 'rtl' : 'ltr' }}>
      <View style={[styles.row, styles.tableHead]}><Text style={[styles.cell, styles.requestCell]}>Demande</Text><Text style={[styles.cell, styles.serviceCell]}>Service</Text><Text style={[styles.cell, styles.statusCell]}>État</Text></View>
      {rows.map(request => {
        const state = requestState(request, now);
        const status = statuses[state];
        return <View key={request.id} style={styles.row}>
          <View style={styles.requestCell}><Text raw={!request.demo} numberOfLines={2} style={styles.requestTitle}>{request.title}</Text><Text raw style={styles.date}>{request.id} · {new Date(request.createdAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}</Text></View>
          <Text style={[styles.cell, styles.serviceCell]}>{request.service}</Text>
          <Pressable disabled={state !== 'overdue'} accessibilityRole={state === 'overdue' ? 'button' : undefined} accessibilityLabel={t(status.label)} onPress={() => alert.alert(request.demo ? t(request.title) : request.title, 'Ces demandes ne sont pas terminées et n’ont reçu aucune réponse administrative depuis au moins 72 heures.')} style={[styles.statusCell, styles.statusLine]}><View style={[styles.dot, { backgroundColor: status.color }]} /><Text style={[styles.label, { color: status.color }]}>{status.label}</Text>{state === 'overdue' && <Text raw style={styles.warning}>!</Text>}</Pressable>
        </View>;
      })}
    </View></ScrollView>
    {rows.length === 0 && <Text style={styles.subtitle}>Aucune demande pour le moment.</Text>}
    <Text style={styles.footnote}>Rouge : non terminée, sans réponse depuis 3 jours.</Text>
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 22, borderWidth: 1, borderColor: '#E6EDE8', padding: 16, marginBottom: 22 },
  heading: { color: '#103D2E', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#78877F', fontSize: 12, marginTop: 6 },
  legend: { flexDirection: 'row', gap: 7, marginVertical: 16 },
  metric: { flex: 1, padding: 10, borderRadius: 14 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  count: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 10, fontWeight: '700', flexShrink: 1, color: '#53685B' },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: '#FDEDED', marginBottom: 12 },
  alertIcon: { color: 'white', backgroundColor: '#C84242', width: 26, height: 26, borderRadius: 13, textAlign: 'center', lineHeight: 26, fontWeight: '900' },
  alertTitle: { color: '#A83131', fontSize: 12, fontWeight: '800' },
  alertBody: { color: '#A83131', fontSize: 11, marginTop: 4 },
  demo: { color: '#78877F', fontSize: 10, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderColor: '#EEF2EF', gap: 12 },
  tableHead: { backgroundColor: '#F6F9F6', borderRadius: 10, paddingVertical: 10 },
  cell: { color: '#53685B', fontSize: 11, fontWeight: '700' },
  requestCell: { width: 198, paddingStart: 8 }, serviceCell: { width: 110 }, statusCell: { width: 142 },
  requestTitle: { color: '#18241F', fontSize: 12, fontWeight: '700' },
  date: { color: '#78877F', fontSize: 10, marginTop: 5 },
  warning: { color: '#C84242', fontWeight: '900' },
  footnote: { color: '#78877F', fontSize: 10, marginTop: 12 },
});
