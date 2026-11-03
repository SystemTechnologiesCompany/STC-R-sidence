import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text, useLocalizedAlert } from './i18n';
import { supabase } from './supabase';

type StaffRequest = { id: string; full_name: string; service: string; created_at: string };

export function ManagerTeam({ residenceId }: { residenceId: string }) {
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const alert = useLocalizedAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;

  const refresh = useCallback(async () => {
    if (!residenceId) { setRequests([]); setLoading(false); return; }
    const { data, error } = await supabase.from('profiles')
      .select('id,full_name,service,created_at')
      .eq('residence_id', residenceId).eq('role', 'staff').eq('role_status', 'pending')
      .order('created_at', { ascending: true });
    if (error) alertRef.current.alert('Impossible de charger les demandes', error.message, true);
    else setRequests((data ?? []) as StaffRequest[]);
    setLoading(false);
  }, [residenceId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const approve = async (id: string) => {
    if (approvingId) return;
    setApprovingId(id);
    const { error } = await supabase.rpc('approve_residence_staff', { p_profile_id: id });
    if (error) alertRef.current.alert('Validation impossible', error.message, true);
    else {
      alertRef.current.alert('Responsable validé', 'Le responsable peut maintenant consulter les signalements de son service.');
      await refresh();
    }
    setApprovingId(null);
  };

  return <View style={styles.wrap}>
    <Text raw style={styles.heading}>Demandes d’accès équipe</Text>
    <Text raw style={styles.subheading}>Chaque responsable ne verra que les signalements de son service.</Text>
    {loading ? <ActivityIndicator color="#16845A" style={{ marginTop: 24 }} /> : requests.length === 0 ? <View style={styles.empty}><Text raw style={styles.emptyText}>Aucune demande en attente.</Text></View> : requests.map(request => (
      <View key={request.id} style={styles.card}>
        <View style={styles.avatar}><Text raw style={styles.avatarText}>{request.full_name.trim().slice(0, 1).toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}><Text raw style={styles.name}>{request.full_name}</Text><Text raw style={styles.service}>{request.service}</Text></View>
        <Pressable accessibilityRole="button" disabled={approvingId !== null} onPress={() => { void approve(request.id); }} style={[styles.approve, approvingId !== null && { opacity: .55 }]}>
          <Text raw style={styles.approveText}>{approvingId === request.id ? '…' : 'Valider'}</Text>
        </Pressable>
      </View>
    ))}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 20 },
  heading: { color: '#18241F', fontSize: 18, fontWeight: '800' },
  subheading: { color: '#78877F', fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 15 },
  empty: { backgroundColor: 'white', borderRadius: 17, borderWidth: 1, borderColor: '#E6EDE8', padding: 16 },
  emptyText: { color: '#78877F', fontSize: 13 },
  card: { minHeight: 70, backgroundColor: 'white', borderRadius: 17, borderWidth: 1, borderColor: '#E6EDE8', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 9 },
  avatar: { width: 39, height: 39, borderRadius: 14, backgroundColor: '#EAF7F0', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#16845A', fontWeight: '900', fontSize: 15 },
  name: { color: '#18241F', fontSize: 13, fontWeight: '800' },
  service: { color: '#78877F', fontSize: 11, marginTop: 4 },
  approve: { backgroundColor: '#16845A', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10 },
  approveText: { color: 'white', fontSize: 11, fontWeight: '800' },
});
