import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import { REPORT_REASONS } from '../lib/validate';
import type { ContentKind } from '../types';
import { Button, Chip, useToast } from './ui';

interface Props {
  visible: boolean;
  onClose: () => void;
  targetType: ContentKind;
  targetId: string;
  targetLabel: string;
  /** Optional extra action offered alongside reporting (e.g. block the user). */
  extraUserId?: string;
  extraLabel?: string;
}

/** Reusable safety sheet used by posts, shorts, videos, stories, chat and profiles. */
export const ReportSheet: React.FC<Props> = ({
  visible, onClose, targetType, targetId, targetLabel, extraUserId, extraLabel,
}) => {
  const { theme } = useTheme();
  const { submitReport, blockUser, muteUser } = useStore();
  const toast = useToast();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');

  const submit = () => {
    if (!reason) return;
    submitReport({ targetType, targetId, targetLabel, reason, details: details.trim() });
    setReason(null);
    setDetails('');
    onClose();
    toast.show('Report sent to moderation. Thank you for keeping VibeConnect safe.', 'shield-checkmark');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close report sheet" />
        <View style={[styles.sheet, { backgroundColor: theme.bg }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Ionicons name="flag" size={18} color={theme.danger} />
            <Text style={{ color: theme.text, fontWeight: '800', fontSize: 17 }}>Report</Text>
          </View>
          <Text style={{ color: theme.textFaint, fontSize: 13, marginBottom: 14 }}>
            {targetLabel} · Reports are anonymous to the reported account.
          </Text>

          <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {REPORT_REASONS.map((r) => (
                <Chip key={r} label={r} active={reason === r} onPress={() => setReason(r)} />
              ))}
            </View>
          </ScrollView>

          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Add details (optional)"
            placeholderTextColor={theme.textFaint}
            multiline
            maxLength={500}
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          />

          {extraUserId && (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <Button
                title={extraLabel ?? 'Block user'}
                variant="secondary"
                icon="ban-outline"
                size="sm"
                onPress={() => {
                  blockUser(extraUserId);
                  onClose();
                  toast.show('User blocked. You will not see each other anymore.', 'ban');
                }}
              />
              <Button
                title="Mute"
                icon="volume-mute-outline"
                size="sm"
                variant="secondary"
                onPress={() => {
                  muteUser(extraUserId);
                  onClose();
                  toast.show('User muted', 'volume-mute');
                }}
              />
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 8 }}>
            <Button title="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1, alignSelf: 'stretch' }} />
            <Button title="Submit report" variant="danger" disabled={!reason} onPress={submit} style={{ flex: 1.4, alignSelf: 'stretch' }} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(6,4,16,0.55)' },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 28 },
  handle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  input: { borderRadius: 16, borderWidth: 1, padding: 14, fontSize: 14, minHeight: 84, textAlignVertical: 'top' },
});
