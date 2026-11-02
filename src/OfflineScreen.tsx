import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import NoWifiIcon from '../assets/stc-icons/no-wifi-svgrepo-com.svg';
import { Text, useLanguage } from './i18n';

export function OfflineScreen({ onRetry, checking }: { onRetry: () => void; checking: boolean }) {
  const { rtl } = useLanguage();
  return <View style={[styles.page, { direction: rtl ? 'rtl' : 'ltr' }]}>
    <View style={styles.glow} />
    <View style={styles.iconHalo}><View style={styles.iconCircle}><NoWifiIcon width={66} height={66} color="#16845A" /></View></View>
    <Text style={styles.eyebrow}>STC RÉSIDENCE</Text>
    <Text style={styles.heading}>Pas de connexion Internet</Text>
    <Text style={styles.body}>Vérifiez votre Wi-Fi ou vos données mobiles, puis réessayez.</Text>
    <Pressable accessibilityRole="button" disabled={checking} onPress={onRetry} style={[styles.button, checking && { opacity: .65 }]}><Text style={styles.buttonText}>{checking ? 'Vérification…' : 'Réessayer'}</Text></Pressable>
    <Text style={styles.footer}>Votre espace sera prêt dès le retour de la connexion.</Text>
  </View>;
}
const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6F9F6', padding: 30, overflow: 'hidden' },
  glow: { position: 'absolute', top: -190, width: 430, height: 430, borderRadius: 215, backgroundColor: '#E2F4E8' },
  iconHalo: { width: 158, height: 158, borderRadius: 52, backgroundColor: '#EAF7F0', alignItems: 'center', justifyContent: 'center', marginBottom: 30, transform: [{ rotate: '-5deg' }] },
  iconCircle: { width: 120, height: 120, borderRadius: 42, backgroundColor: 'white', borderWidth: 1, borderColor: '#D8EBDD', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '5deg' }], shadowColor: '#103D2E', shadowOpacity: .1, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 5 },
  eyebrow: { color: '#16845A', fontWeight: '900', fontSize: 11, letterSpacing: 1.6 },
  heading: { color: '#103D2E', fontSize: 25, lineHeight: 32, fontWeight: '900', textAlign: 'center', marginTop: 15 },
  body: { color: '#78877F', fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: 9, maxWidth: 310 },
  button: { backgroundColor: '#16845A', minWidth: 180, minHeight: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 25, marginTop: 27, shadowColor: '#16845A', shadowOpacity: .23, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  buttonText: { color: 'white', fontWeight: '800', fontSize: 15 },
  footer: { color: '#98A69D', fontSize: 11, textAlign: 'center', marginTop: 32 },
});
