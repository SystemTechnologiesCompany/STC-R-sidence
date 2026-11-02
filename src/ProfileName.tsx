import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, TextInput, useLanguage } from './i18n';

type Profile = { name: string; firstSetAt: number };
const key = 'stc.demo.profile.v1';
const waitingPeriod = 14 * 86400000;
export function useProfileName() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(key).then(value => {
      const saved = value ? JSON.parse(value) : null;
      if (saved && (typeof saved.name !== 'string' || !Number.isFinite(saved.firstSetAt))) throw new Error('Invalid profile');
      if (active) { setProfile(saved); setReady(true); }
    }).catch(() => { if (active) setReady(false); });
    return () => { active = false; };
  }, []);
  const save = async (draft: string): Promise<string | null> => {
    if (!ready || savingRef.current) return 'Veuillez patienter ou réouvrir l’application.';
    const name = draft.trim().replace(/\s+/g, ' ');
    if (name.length < 2 || name.length > 60) return 'Le nom doit contenir entre 2 et 60 caractères.';
    if (name === profile?.name) return null;
    if (profile && Date.now() < profile.firstSetAt + waitingPeriod) return 'Votre nom est modifiable 14 jours après sa première saisie.';
    savingRef.current = true; setSaving(true);
    try {
      const next = { name, firstSetAt: profile?.firstSetAt ?? Date.now() };
      await AsyncStorage.setItem(key, JSON.stringify(next));
      setProfile(next);
      return null;
    } catch { return 'Impossible d’enregistrer le nom. Réessayez.'; }
    finally { savingRef.current = false; setSaving(false); }
  };
  return { profile, ready, saving, save };
}

export function ProfileNameEditor({ account, onClose }: { account: ReturnType<typeof useProfileName>; onClose: () => void }) {
  const { rtl, language, t } = useLanguage();
  const [draft, setDraft] = useState(account.profile?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const unlockAt = account.profile ? account.profile.firstSetAt + waitingPeriod : 0;
  const locked = Date.now() < unlockAt;
  return <View style={styles.editor}>
    <Text style={styles.label}>Nom complet</Text>
    <TextInput accessibilityLabel={t('Nom complet')} value={draft} onChangeText={setDraft} editable={account.ready && !locked && !account.saving} maxLength={60} autoCapitalize="words" placeholder="Saisissez votre nom" style={styles.input} />
    <Text style={styles.hint}>Votre nom est modifiable 14 jours après sa première saisie.</Text>
    {locked && <Text raw style={styles.hint}>{rtl ? 'متاح ابتداءً من ' : 'Disponible à partir du '}{new Date(unlockAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}</Text>}
    {!account.ready && <Text style={styles.error}>Veuillez patienter ou réouvrir l’application.</Text>}
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" disabled={account.saving} onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Annuler</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: !account.ready || locked || account.saving }} disabled={!account.ready || locked || account.saving} onPress={async () => { const message = await account.save(draft); if (message) setError(message); else onClose(); }} style={[styles.save, (!account.ready || locked || account.saving) && { opacity: .45 }]}><Text style={styles.saveText}>{account.saving ? 'Enregistrement…' : 'Enregistrer'}</Text></Pressable>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  editor: { paddingVertical: 16, gap: 10 },
  label: { color: '#103D2E', fontWeight: '800', fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#D8E8DE', borderRadius: 13, backgroundColor: '#F6F9F6', padding: 13, color: '#18241F', fontSize: 15 },
  hint: { color: '#78877F', fontSize: 11, lineHeight: 18 },
  error: { color: '#B13C3C', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  save: { flex: 1, backgroundColor: '#16845A', padding: 13, alignItems: 'center', borderRadius: 13 },
  cancel: { flex: 1, backgroundColor: '#EAF7F0', padding: 13, alignItems: 'center', borderRadius: 13 },
  saveText: { color: 'white', fontWeight: '800' }, cancelText: { color: '#16845A', fontWeight: '800' },
});
