import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';
import { Text, useLanguage, useLocalizedAlert } from './i18n';
import { PopIn } from './motion';
import ShareIcon from '../assets/stc-icons/share-nodes-svgrepo-com.svg';
import TeamIcon from '../assets/stc-icons/team-svgrepo-com.svg';
import HouseIcon from '../assets/stc-icons/house-smile-svgrepo-com.svg';

const projects = [
  { name: 'STC References', url: 'https://stcreferences.netlify.app/#top' },
  { name: 'STC LearnIt', url: 'https://stclearnit.netlify.app/' },
  { name: 'STC FoundIt', url: 'https://stcfoundit.netlify.app/' },
];

export function DiscoverSTC() {
  const [panel, setPanel] = useState<'projects' | 'about' | null>(null);
  const { rtl } = useLanguage();
  const alert = useLocalizedAlert();
  const open = async (url: string) => {
    try { await Linking.openURL(url); }
    catch { alert.alert(rtl ? 'تعذّر فتح الرابط' : 'Lien indisponible', rtl ? 'تحقق من اتصالك بالإنترنت ثم أعد المحاولة.' : 'Vérifiez votre connexion Internet puis réessayez.', true); }
  };
  const close = () => setPanel(null);
  return <>
    <Text style={styles.section}>DÉCOUVRIR STC</Text>
    <View style={styles.card}>
      <Pressable accessibilityRole="link" onPress={() => { void open('https://stc-official.netlify.app/'); }} style={styles.row}><View style={styles.icon}><ShareIcon width={18} height={18} /></View><Text style={styles.label}>STC Officiel</Text><Text raw style={styles.arrow}>{rtl ? '↖' : '↗'}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => setPanel('projects')} style={styles.row}><View style={styles.icon}><TeamIcon width={18} height={18} /></View><Text style={styles.label}>Projets STC</Text><Text raw style={styles.arrow}>{rtl ? '‹' : '›'}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => setPanel('about')} style={[styles.row, { borderBottomWidth: 0 }]}><View style={styles.icon}><HouseIcon width={18} height={18} /></View><Text style={styles.label}>À propos de l’application</Text><Text raw style={styles.arrow}>{rtl ? '‹' : '›'}</Text></Pressable>
    </View>
    <Modal visible={panel !== null} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel={rtl ? 'إغلاق' : 'Fermer'} onPress={close} style={StyleSheet.absoluteFill} />
        {panel && <PopIn style={styles.dialog}><View accessibilityViewIsModal style={{ direction: rtl ? 'rtl' : 'ltr' }}>
          <View style={styles.modalHeader}><Image source={require('../assets/stc-logo.png')} resizeMode="contain" style={{ width: 45, height: 45 }} /><Pressable accessibilityRole="button" accessibilityLabel={rtl ? 'إغلاق' : 'Fermer'} onPress={close} style={styles.close}><Text raw style={styles.closeText}>×</Text></Pressable></View>
          <Text style={styles.title}>{panel === 'projects' ? 'Projets STC' : 'À propos de l’application'}</Text>
          <ScrollView style={{ maxHeight: 350 }}>
            {panel === 'projects' ? projects.map(project => <Pressable accessibilityRole="link" key={project.name} onPress={() => { void open(project.url); }} style={styles.project}><View style={{ flex: 1 }}><Text raw style={styles.projectName}>{project.name}</Text><Text raw style={styles.domain}>{new URL(project.url).hostname}</Text></View><Text raw style={styles.linkArrow}>{rtl ? '↖' : '↗'}</Text></Pressable>) : <Pressable accessibilityRole="link" onPress={() => { void open('https://stc-official.netlify.app/our-team'); }} style={styles.project}><View style={styles.icon}><TeamIcon width={21} height={21} /></View><Text raw style={[styles.projectName, { flex: 1 }]}>{rtl ? 'من نحن؟' : 'Qui sommes-nous ?'}</Text><Text raw style={styles.linkArrow}>{rtl ? '↖' : '↗'}</Text></Pressable>}
          </ScrollView>
        </View></PopIn>}
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  section: { color: '#89968E', fontSize: 10, letterSpacing: 1.2, fontWeight: '800', marginTop: 21, marginBottom: 10 },
  card: { backgroundColor: 'white', borderWidth: 1, borderColor: '#E6EDE8', borderRadius: 17, paddingHorizontal: 13, marginBottom: 7 },
  row: { minHeight: 54, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEF2EF', gap: 10 },
  icon: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center' },
  label: { color: '#18241F', fontSize: 12, fontWeight: '700', flex: 1 },
  arrow: { color: '#96A49B', fontSize: 22, paddingHorizontal: 5 },
  overlay: { flex: 1, backgroundColor: 'rgba(16,61,46,.38)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 420, padding: 22, borderRadius: 28, backgroundColor: 'white', borderWidth: 1, borderColor: '#E6EDE8', elevation: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  close: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F0F6F2', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#103D2E', fontSize: 26 },
  title: { color: '#103D2E', fontSize: 21, fontWeight: '800', marginBottom: 15 },
  project: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: '#EAF7F0', borderWidth: 1, borderColor: '#D8EBDD', borderRadius: 16, padding: 15, marginBottom: 9, minHeight: 65 },
  projectName: { color: '#103D2E', fontSize: 14, fontWeight: '800' },
  domain: { color: '#78877F', fontSize: 11, marginTop: 5 },
  linkArrow: { color: '#16845A', fontSize: 21 },
});
