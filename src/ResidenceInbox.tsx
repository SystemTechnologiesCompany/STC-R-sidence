import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardFocusContext } from './KeyboardLayout';
import { Text, TextInput, useLanguage, useLocalizedAlert } from './i18n';
import { supabase } from './supabase';
import { StoredPhoto } from './photos';

type Role = 'student' | 'staff' | 'manager';
type Report = {
  id: string;
  student_id: string;
  subject: string;
  details: string;
  photo_path: string | null;
  service: string;
  status: 'queued' | 'in_progress' | 'done';
  created_at: string;
};
type Message = { id: string; sender_id: string; body: string; created_at: string };

export function ResidenceInbox({ role, residenceId, service, userId }: {
  role: Role;
  residenceId: string;
  service: string | null;
  userId: string;
}) {
  const [reports, setReports] = useState<Report[]>([]);
  const [selected, setSelected] = useState<Report | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [refreshingMessages, setRefreshingMessages] = useState(false);
  const { language } = useLanguage();
  const alert = useLocalizedAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;

  const loadReports = useCallback(async () => {
    if (!userId || !residenceId) { setReports([]); setLoading(false); return; }
    setLoading(true);
    let query = supabase.from('reports')
      .select('id,student_id,subject,details,photo_path,service,status,created_at')
      .order('created_at', { ascending: false });
    if (role === 'student') query = query.eq('student_id', userId);
    else {
      query = query.eq('residence_id', residenceId);
      if (role === 'staff' && service) query = query.eq('service', service);
    }
    const { data, error } = await query;
    if (error) alertRef.current.alert('Impossible de charger les signalements', error.message, true);
    else setReports((data ?? []) as Report[]);
    setLoading(false);
  }, [residenceId, role, service, userId]);

  const loadMessages = useCallback(async (reportId: string) => {
    setRefreshingMessages(true);
    const { data, error } = await supabase.from('report_messages')
      .select('id,sender_id,body,created_at').eq('report_id', reportId)
      .order('created_at', { ascending: true });
    if (error) alertRef.current.alert('Impossible de charger la conversation', error.message, true);
    else setMessages((data ?? []) as Message[]);
    setRefreshingMessages(false);
  }, []);

  useEffect(() => { void loadReports(); }, [loadReports]);
  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`reports-for-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => { void loadReports(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loadReports, userId]);
  useEffect(() => {
    if (selected) void loadMessages(selected.id);
    else setMessages([]);
  }, [loadMessages, selected]);
  useEffect(() => {
    if (!selected) return;
    const channel = supabase.channel(`messages-for-${selected.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'report_messages', filter: `report_id=eq.${selected.id}` }, () => { void loadMessages(selected.id); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loadMessages, selected]);

  const sendMessage = async () => {
    const body = draft.trim();
    if (!selected || !body || sending) return;
    setSending(true);
    const { error } = await supabase.from('report_messages').insert({
      report_id: selected.id,
      sender_id: userId,
      body,
    });
    if (error) alertRef.current.alert('Message non envoyé', error.message, true);
    else {
      setDraft('');
      await loadMessages(selected.id);
    }
    setSending(false);
  };

  const markComplete = async () => {
    if (!selected || completing || selected.status === 'done') return;
    setCompleting(true);
    const { data, error } = await supabase.rpc('complete_residence_report', { p_report_id: selected.id });
    if (error) alertRef.current.alert('Impossible de clôturer le signalement', error.message, true);
    else {
      setSelected(current => current ? { ...current, status: 'done' } : null);
      setReports(current => current.map(report => report.id === selected.id ? { ...report, status: 'done' } : report));
      await loadReports();
    }
    setCompleting(false);
  };

  const statusLabel = (status: Report['status']) => status === 'done' ? 'Terminée' : status === 'in_progress' ? 'En cours' : 'En attente';
  const dateLabel = (value: string) => new Date(value).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

  return <View style={styles.wrap}>
    <Text raw style={styles.intro}>{role === 'student' ? 'Suivez vos signalements et échangez avec le service concerné.' : role === 'manager' ? 'Signalements de tous les services de votre résidence.' : `Signalements transmis au service ${service ?? ''}.`}</Text>
    {loading ? <View style={styles.loading}><ActivityIndicator color="#16845A" /></View> : reports.length === 0 ? <View style={styles.empty}><Text raw style={styles.emptyTitle}>Aucun signalement pour le moment</Text><Text raw style={styles.emptyBody}>{role === 'student' ? 'Vos demandes envoyées apparaîtront ici.' : 'Les nouveaux signalements apparaîtront ici.'}</Text></View> : reports.map(report => (
      <Pressable key={report.id} onPress={() => setSelected(report)} style={({ pressed }) => [styles.card, pressed && { opacity: .8, transform: [{ scale: .99 }] }]}>
        <View style={styles.cardTop}><Text raw style={[styles.status, report.status === 'done' && styles.done]}>{statusLabel(report.status)}</Text><Text raw style={styles.date}>{dateLabel(report.created_at)}</Text></View>
        <Text raw style={styles.title}>{report.subject}</Text>
        <Text raw style={styles.service}>{report.service}</Text>
        <Text raw numberOfLines={3} style={styles.details}>{report.details}</Text>
        <Text raw style={styles.link}>Ouvrir la conversation  →</Text>
      </Pressable>
    ))}

    <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
      <KeyboardFocusContext.Provider value={null}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setSelected(null)} style={styles.close}><Text raw style={styles.closeText}>‹</Text></Pressable>
            <View style={{ flex: 1 }}><Text raw numberOfLines={1} style={styles.modalTitle}>{selected?.subject ?? ''}</Text><Text raw style={styles.service}>{selected?.service ?? ''} · {selected ? statusLabel(selected.status) : ''}</Text></View>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" style={styles.thread} contentContainerStyle={{ paddingVertical: 14, gap: 10 }}>
            {selected && <View style={styles.originalMessage}><Text raw style={styles.messageLabel}>Signalement · {dateLabel(selected.created_at)}</Text><Text raw style={styles.messageBody}>{selected.details}</Text></View>}
            {selected && role !== 'student' && selected.status !== 'done' && <Pressable accessibilityRole="button" disabled={completing} onPress={() => { void markComplete(); }} style={[styles.completeButton, completing && { opacity: .6 }]}><Text style={styles.completeButtonText}>{completing ? 'Clôture…' : 'Marquer comme terminé'}</Text></Pressable>}
            {selected?.photo_path && <StoredPhoto path={selected.photo_path} />}
            {refreshingMessages && <ActivityIndicator color="#16845A" />}
            {messages.map(message => <View key={message.id} style={[styles.bubble, message.sender_id === userId ? styles.ownBubble : styles.otherBubble]}><Text raw style={styles.messageBody}>{message.body}</Text><Text raw style={styles.messageDate}>{dateLabel(message.created_at)}</Text></View>)}
          </ScrollView>
          <View style={styles.composer}>
            <TextInput value={draft} onChangeText={setDraft} placeholder="Écrire une réponse…" multiline maxLength={5000} style={styles.input} />
            <Pressable accessibilityRole="button" disabled={!draft.trim() || sending} onPress={sendMessage} style={[styles.send, (!draft.trim() || sending) && { opacity: .45 }]}><Text raw style={styles.sendText}>{sending ? '…' : '➤'}</Text></Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
      </KeyboardFocusContext.Provider>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 24 },
  intro: { color: '#78877F', fontSize: 13, lineHeight: 20, marginBottom: 14 },
  loading: { padding: 36, alignItems: 'center' },
  empty: { borderRadius: 18, padding: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#E6EDE8' },
  emptyTitle: { color: '#18241F', fontWeight: '800', fontSize: 14 },
  emptyBody: { color: '#78877F', fontSize: 12, lineHeight: 18, marginTop: 6 },
  card: { backgroundColor: 'white', borderRadius: 18, borderWidth: 1, borderColor: '#E6EDE8', padding: 15, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  status: { color: '#D68120', fontWeight: '800', fontSize: 11 },
  done: { color: '#16845A' },
  date: { color: '#87918B', fontSize: 10 },
  title: { color: '#18241F', fontWeight: '800', fontSize: 14, marginTop: 10 },
  service: { color: '#16845A', fontSize: 11, fontWeight: '700', marginTop: 4 },
  details: { color: '#67756D', fontSize: 12, lineHeight: 18, marginTop: 8 },
  link: { color: '#16845A', fontSize: 12, fontWeight: '800', marginTop: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(14,34,25,.45)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: '#F6F9F6', borderRadius: 24, height: '86%', padding: 15, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#E6EDE8' },
  close: { width: 37, height: 37, borderRadius: 13, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#103D2E', fontSize: 28, lineHeight: 30 },
  modalTitle: { color: '#18241F', fontSize: 15, fontWeight: '800' },
  thread: { flex: 1 },
  originalMessage: { alignSelf: 'stretch', borderRadius: 16, backgroundColor: 'white', padding: 13, borderWidth: 1, borderColor: '#E6EDE8' },
  completeButton: { alignSelf: 'flex-start', backgroundColor: '#EAF7F0', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10 },
  completeButtonText: { color: '#16845A', fontSize: 11, fontWeight: '800' },
  messageLabel: { color: '#78877F', fontSize: 10, fontWeight: '700', marginBottom: 6 },
  bubble: { maxWidth: '88%', borderRadius: 16, padding: 12 },
  ownBubble: { alignSelf: 'flex-end', backgroundColor: '#DDF1E4' },
  otherBubble: { alignSelf: 'flex-start', backgroundColor: 'white', borderWidth: 1, borderColor: '#E6EDE8' },
  messageBody: { color: '#18241F', fontSize: 13, lineHeight: 19 },
  messageDate: { color: '#78877F', fontSize: 9, marginTop: 5, textAlign: 'right' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 10, borderTopWidth: 1, borderColor: '#E6EDE8' },
  input: { flex: 1, maxHeight: 100, minHeight: 44, backgroundColor: 'white', borderRadius: 15, paddingHorizontal: 13, paddingVertical: 10, color: '#18241F', borderWidth: 1, borderColor: '#E6EDE8', textAlignVertical: 'center' },
  send: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#16845A', alignItems: 'center', justifyContent: 'center' },
  sendText: { color: 'white', fontSize: 18, fontWeight: '800' },
});
