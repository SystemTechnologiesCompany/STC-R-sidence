import { useEffect, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import type * as Picker from 'expo-image-picker';
import { Text, useLocalizedAlert } from './i18n';
import { supabase } from './supabase';

export type SelectedPhoto = { uri: string; base64: string };
const bucket = 'residence-photos';

export function photoError(error: unknown): string {
  return error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
    ? error.message : 'Impossible de charger la photo. Réessayez.';
}

export async function choosePhoto(): Promise<SelectedPhoto | null> {
  let picker: typeof Picker;
  try { picker = require('expo-image-picker') as typeof Picker; }
  catch { throw new Error('Installez la nouvelle version APK pour ajouter des photos.'); }
  const result = await picker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: .7, base64: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset.base64) throw new Error('La photo sélectionnée est illisible.');
  if (asset.base64.length * .75 > 6 * 1024 * 1024) throw new Error('Choisissez une photo de moins de 6 Mo.');
  return { uri: asset.uri, base64: asset.base64 };
}

export async function uploadPhoto(userId: string, photo: SelectedPhoto): Promise<string> {
  const binary = atob(photo.base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, bytes.buffer, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}

export async function removePhoto(path: string) { await supabase.storage.from(bucket).remove([path]); }

export function StoredPhoto({ path, avatar = false }: { path: string; avatar?: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setUrl(null);
    void supabase.storage.from(bucket).createSignedUrl(path, 3600).then(({ data }) => { if (active) setUrl(data?.signedUrl ?? null); });
    return () => { active = false; };
  }, [path]);
  return url ? <Image accessibilityLabel="Photo" source={{ uri: url }} resizeMode="cover" style={avatar ? { width: 54, height: 54, borderRadius: 20 } : { width: '100%', height: 220, borderRadius: 14, marginVertical: 10 }} /> : null;
}

export function ReportPhotoPicker({ value, onChange, disabled }: { value: SelectedPhoto | null; onChange: (photo: SelectedPhoto | null) => void; disabled: boolean }) {
  const alert = useLocalizedAlert();
  const [busy, setBusy] = useState(false);
  return <View style={{ gap: 8 }}>
    {value && <Image source={{ uri: value.uri }} style={{ width: '100%', height: 190, borderRadius: 15 }} resizeMode="cover" />}
    <Pressable disabled={disabled || busy} onPress={async () => {
      setBusy(true);
      try { const photo = await choosePhoto(); if (photo) onChange(photo); }
      catch (error) { alert.alert('Photo', photoError(error), true); }
      finally { setBusy(false); }
    }} style={{ borderWidth: 1, borderColor: '#B7C8BD', borderRadius: 15, padding: 16, alignItems: 'center', backgroundColor: '#EAF7F0', opacity: disabled || busy ? .5 : 1 }}><Text style={{ color: '#16845A', fontWeight: '700' }}>{busy ? 'Chargement…' : value ? 'Changer la photo' : 'Ajouter une photo'}</Text></Pressable>
    {value && <Pressable disabled={disabled} onPress={() => onChange(null)}><Text style={{ color: '#B13C3C', textAlign: 'center', padding: 8 }}>Retirer la photo</Text></Pressable>}
  </View>;
}

export function ProfilePhoto({ userId, avatarOnly = false, onSaved }: { userId: string; avatarOnly?: boolean; onSaved?: () => void }) {
  const [path, setPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const alert = useLocalizedAlert();
  useEffect(() => {
    let active = true;
    setPath(null);
    if (userId) void supabase.from('profiles').select('avatar_path').eq('id', userId).maybeSingle().then(({ data }) => { if (active) setPath(data?.avatar_path ?? null); });
    return () => { active = false; };
  }, [userId]);
  const change = async () => {
    if (!userId || busy) return;
    setBusy(true);
    let newPath: string | null = null;
    try {
      const photo = await choosePhoto();
      if (!photo) return;
      newPath = await uploadPhoto(userId, photo);
      const { error } = await supabase.rpc('set_my_avatar', { p_path: newPath });
      if (error) throw error;
      const oldPath = path;
      setPath(newPath);
      newPath = null;
      onSaved?.();
      if (oldPath) void removePhoto(oldPath);
    } catch (error) { if (newPath) void removePhoto(newPath); alert.alert('Photo de profil', photoError(error), true); }
    finally { setBusy(false); }
  };
  return <Pressable accessibilityRole="button" disabled={!userId || busy || avatarOnly} onPress={() => { void change(); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: avatarOnly ? 0 : 10 }}>
    {path ? <StoredPhoto path={path} avatar /> : <View style={{ width: 54, height: 54, borderRadius: 20, backgroundColor: '#EAF7F0', alignItems: 'center', justifyContent: 'center' }}><Text raw style={{ color: '#16845A', fontSize: 24 }}>＋</Text></View>}
    {!avatarOnly && <Text style={{ color: '#18241F', fontWeight: '700', fontSize: 12 }}>{busy ? 'Chargement…' : 'Photo de profil'}</Text>}
  </Pressable>;
}
