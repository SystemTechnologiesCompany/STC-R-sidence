import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useLanguage } from './i18n';
import type { RequestAccess, ResidenceRequest } from './requests';

export function ServiceRequests({ access, requests, onOpenInbox }: { access: RequestAccess; requests: ResidenceRequest[]; onOpenInbox: () => void }) {
  const { language } = useLanguage();
  const visible = requests;
  if (access.role === 'student') return null;
  return <View>
    <Text style={styles.scope}>{access.role === 'manager' ? 'Tous les services de votre résidence' : 'Demandes de votre service uniquement'}</Text>
    <View style={styles.metrics}>{[
      { label: 'À traiter', count: visible.filter(item => item.status !== 'done' && item.adminRepliedAt === null).length },
      { label: 'En cours', count: visible.filter(item => item.status !== 'done' && item.adminRepliedAt !== null).length },
      { label: 'Résolus', count: visible.filter(item => item.status === 'done').length },
    ].map(item => <View key={item.label} style={styles.metric}><Text raw style={styles.count}>{item.count}</Text><Text style={styles.caption}>{item.label}</Text></View>)}</View>
    {visible.length === 0 && <View style={styles.card}><Text style={styles.title}>Aucune demande pour le moment.</Text></View>}
    {visible.map(request => <Pressable accessibilityRole="button" key={request.id} onPress={onOpenInbox} style={styles.card}>
      <View style={styles.top}><Text style={styles.status}>{request.status === 'done' ? 'Terminées' : request.adminRepliedAt !== null ? 'En cours' : 'En attente'}</Text><Text raw style={styles.caption}>{new Date(request.createdAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}</Text></View>
      <Text raw style={styles.title}>{request.title}</Text>
      <Text style={styles.caption}>{request.service}</Text>
      <Text raw style={styles.caption}>{request.id}</Text>
      <View style={styles.button}><Text style={styles.buttonText}>Ouvrir & répondre</Text></View>
    </Pressable>)}
  </View>;
}
const styles = StyleSheet.create({
  scope: { color: '#78877F', fontSize: 12, marginBottom: 14 },
  metrics: { flexDirection: 'row', gap: 9, marginBottom: 16 },
  metric: { flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: '#E6EDE8', padding: 12, borderRadius: 16 },
  count: { color: '#16845A', fontWeight: '800', fontSize: 22 },
  caption: { color: '#78877F', fontSize: 11, marginTop: 4 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#E6EDE8', marginBottom: 12 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  status: { color: '#16845A', fontSize: 11, fontWeight: '700' },
  title: { color: '#18241F', fontSize: 14, fontWeight: '800', marginVertical: 10 },
  button: { backgroundColor: '#EAF7F0', borderRadius: 12, padding: 12, marginTop: 14, alignItems: 'center' },
  buttonText: { color: '#16845A', fontSize: 12, fontWeight: '800' },
});
