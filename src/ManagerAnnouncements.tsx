import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput, useLocalizedAlert } from './i18n';
import { supabase } from './supabase';

type Member = { id: string; full_name: string; role: string; service: string | null };

export function ManagerAnnouncements({ residenceId }: { residenceId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const alert = useLocalizedAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;

  const refresh = useCallback(async () => {
    if (!residenceId) { setMembers([]); setLoading(false); return; }
    const { data, error } = await supabase.from('profiles')
      .select('id,full_name,role,service').eq('residence_id', residenceId)
      .neq('role_status', 'rejected').order('full_name');
    if (error) alertRef.current.alert('Impossible de charger les résidents', error.message, true);
    else setMembers((data ?? []) as Member[]);
    setLoading(false);
  }, [residenceId]);

  useEffect(() => { void refresh(); }, [refresh]);
  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const send = async () => {
    const cleanMessage = message.trim();
    if (!cleanMessage || sending) return;
    setSending(true);
    const { error } = await supabase.rpc('send_residence_announcement', {
      p_message: cleanMessage,
      p_recipient_ids: selected,
    });
    if (error) alertRef.current.alert('Annonce non envoyée', error.message, true);
    else {
      setMessage('');
      setSelected([]);
      alertRef.current.alert('Annonce envoyée', selected.length ? `Envoyée à ${selected.length} personne(s).` : 'Envoyée à toute la résidence.');
    }
    setSending(false);
  };

  return <View style={styles.card}>
    <Text style={styles.heading}>Annonce de résidence</Text>
    <Text style={styles.help}>Sans destinataire sélectionné, l’annonce sera envoyée à toute la résidence.</Text>
    <TextInput value={message} onChangeText={setMessage} multiline maxLength={3000} placeholder="Écrire une annonce…" style={styles.input} />
    <View style={styles.listHeading}><Text style={styles.subheading}>Destinataires facultatifs</Text><Pressable onPress={() => setSelected([])}><Text style={styles.reset}>Tout le monde</Text></Pressable></View>
    {loading ? <ActivityIndicator color="#16845A" style={{ margin: 14 }} /> : members.length === 0 ? <Text style={styles.empty}>Aucun membre trouvé.</Text> : <ScrollView nestedScrollEnabled style={styles.members} contentContainerStyle={{ gap: 7 }}>
      {members.map(member => {
        const checked = selected.includes(member.id);
        const label = member.role === 'manager' ? 'Gestionnaire' : member.role === 'staff' ? member.service ?? 'Service' : 'Étudiant';
        return <Pressable key={member.id} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => toggle(member.id)} style={[styles.member, checked && styles.memberActive]}>
          <View style={[styles.check, checked && styles.checkActive]}>{checked && <Text raw style={styles.checkMark}>✓</Text>}</View>
          <View style={{ flex: 1 }}><Text raw style={styles.memberName}>{member.full_name}</Text><Text raw style={styles.memberRole}>{label}</Text></View>
        </Pressable>;
      })}
    </ScrollView>}
    <Pressable accessibilityRole="button" disabled={!message.trim() || sending} onPress={() => { void send(); }} style={[styles.send, (!message.trim() || sending) && { opacity: .5 }]}><Text style={styles.sendText}>{sending ? 'Envoi…' : selected.length ? `Envoyer à ${selected.length} personne(s)` : 'Envoyer à toute la résidence'}</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 19, padding: 15, borderWidth: 1, borderColor: '#E6EDE8', marginTop: 12 },
  heading: { color: '#18241F', fontSize: 16, fontWeight: '800' },
  help: { color: '#78877F', fontSize: 11, lineHeight: 17, marginTop: 5, marginBottom: 10 },
  input: { backgroundColor: '#F6F9F6', minHeight: 80, textAlignVertical: 'top', borderRadius: 13, padding: 12, color: '#18241F', borderWidth: 1, borderColor: '#E6EDE8' },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13, marginBottom: 8 },
  subheading: { color: '#53685B', fontSize: 11, fontWeight: '800' },
  reset: { color: '#16845A', fontSize: 11, fontWeight: '800' },
  members: { maxHeight: 190 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, borderRadius: 12, backgroundColor: '#F8FAF8' },
  memberActive: { backgroundColor: '#EAF7F0' },
  check: { width: 20, height: 20, borderWidth: 1, borderColor: '#C8D4CC', borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' },
  checkActive: { borderColor: '#16845A', backgroundColor: '#16845A' },
  checkMark: { color: 'white', fontSize: 12, fontWeight: '900' },
  memberName: { color: '#18241F', fontSize: 12, fontWeight: '700' },
  memberRole: { color: '#78877F', fontSize: 10, marginTop: 2 },
  empty: { color: '#78877F', fontSize: 12, padding: 10 },
  send: { minHeight: 45, borderRadius: 13, backgroundColor: '#16845A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, marginTop: 12 },
  sendText: { color: 'white', fontSize: 12, fontWeight: '800' },
});
