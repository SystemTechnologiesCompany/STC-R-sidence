import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput, useLanguage } from './i18n';
import { supabase } from './supabase';

type Profile = { name: string; firstSetAt: number; changesUsed: number };
type ServerProfile = { id: string; full_name: string; name_last_changed_at: string; name_changes_used: number };
const waitingPeriod = 14 * 86400000;
export function useProfileName(serverProfile: ServerProfile | null, onSaved?: (profile: ServerProfile) => void) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  useEffect(() => {
    setProfile(serverProfile ? {
      name: serverProfile.full_name,
      firstSetAt: Date.parse(serverProfile.name_last_changed_at),
      changesUsed: serverProfile.name_changes_used ?? 0,
    } : null);
    setReady(true);
  }, [serverProfile?.id, serverProfile?.full_name, serverProfile?.name_last_changed_at, serverProfile?.name_changes_used]);
  const save = async (draft: string): Promise<string | null> => {
    if (!ready || !serverProfile || savingRef.current) return 'Connectez-vous pour enregistrer votre nom.';
    const name = draft.trim().replace(/\s+/g, ' ');
    if (name.length < 2 || name.length > 60) return 'Le nom doit contenir entre 2 et 60 caractères.';
    if (name === profile?.name) return null;
    if (profile && profile.changesUsed >= 2 && Date.now() < profile.firstSetAt + waitingPeriod) return 'Votre prochaine modification sera disponible 14 jours après le dernier changement.';
    savingRef.current = true; setSaving(true);
    try {
      const { data, error } = await supabase.rpc('change_my_profile_name', { p_full_name: name });
      if (error) return error.message;
      const updated = Array.isArray(data) ? data[0] : data;
      if (!updated?.full_name || !updated?.name_last_changed_at) return 'Le serveur n’a pas confirmé le nouveau nom.';
      setProfile({ name: updated.full_name, firstSetAt: Date.parse(updated.name_last_changed_at), changesUsed: updated.name_changes_used ?? 2 });
      onSaved?.(updated as ServerProfile);
      return null;
    } catch (error) { return error instanceof Error ? error.message : 'Impossible d’enregistrer le nom. Réessayez.'; }
    finally { savingRef.current = false; setSaving(false); }
  };
  return { profile, ready, saving, save };
}

export function ProfileNameEditor({ account, onClose }: { account: ReturnType<typeof useProfileName>; onClose: () => void }) {
  const { rtl, language, t } = useLanguage();
  const [draft, setDraft] = useState(account.profile?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const unlockAt = account.profile ? account.profile.firstSetAt + waitingPeriod : 0;
  const remaining = Math.max(0, 2 - (account.profile?.changesUsed ?? 0));
  const locked = remaining === 0 && Date.now() < unlockAt;
  return <View style={styles.editor}>
    <Text style={styles.label}>Nom complet</Text>
    <TextInput accessibilityLabel={t('Nom complet')} value={draft} onChangeText={setDraft} editable={account.ready && !locked && !account.saving} maxLength={60} autoCapitalize="words" placeholder="Saisissez votre nom" style={styles.input} />
    <Text raw style={styles.hint}>{rtl
      ? remaining > 0 ? `يمكنك تغيير اسمك ${remaining} مرة قبل بدء مهلة 14 يومًا.` : 'يمكنك تغيير اسمك مرة كل 14 يومًا بعد آخر تغيير.'
      : remaining > 0 ? `${remaining} modification(s) disponible(s) avant le délai de 14 jours.` : 'Votre nom est modifiable tous les 14 jours après le dernier changement.'}</Text>
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
