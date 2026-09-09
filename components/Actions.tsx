import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as db from '../lib/db';
import { useApp, useTheme } from '../lib/store';
import { radii, spacing } from '../lib/theme';
import { REPORT_REASONS } from '../lib/types';
import { Avatar } from './Avatar';
import { Button, Chip, Field, Sheet } from './UI';

type IconName = keyof typeof Ionicons.glyphMap;

export interface MenuAction {
  label: string;
  icon: IconName;
  destructive?: boolean;
  onPress: () => void;
}

export function ActionSheet({ visible, onClose, title, subtitle, actions }: { visible: boolean; onClose: () => void; title?: string; subtitle?: string; actions: MenuAction[] }) {
  const theme = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {subtitle ? <Text style={{ color: theme.textMuted, fontSize: 13, marginBottom: spacing.md }}>{subtitle}</Text> : null}
      {actions.map((action, i) => (
        <Pressable
          key={action.label}
          onPress={() => {
            onClose();
            action.onPress();
          }}
          style={({ pressed }) => [
            styles.actionRow,
            { backgroundColor: pressed ? theme.surfaceAlt : 'transparent', borderColor: theme.divider, opacity: pressed ? 0.85 : 1, marginTop: i === 0 ? 0 : 4 },
          ]}
        >
          <View style={[styles.actionIcon, { backgroundColor: action.destructive ? `${theme.danger}1F` : theme.surfaceAlt }]}>
            <Ionicons name={action.icon} size={18} color={action.destructive ? theme.danger : theme.text} />
          </View>
          <Text style={{ color: action.destructive ? theme.danger : theme.text, fontSize: 15, fontWeight: '600', flex: 1 }}>{action.label}</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.textFaint} />
        </Pressable>
      ))}
    </Sheet>
  );
}

export function ReportSheet({
  visible,
  onClose,
  targetType,
  targetId,
  targetLabel,
}: {
  visible: boolean;
  onClose: () => void;
  targetType: 'post' | 'user' | 'comment' | 'message' | 'story' | 'video';
  targetId: string;
  targetLabel?: string;
}) {
  const theme = useTheme();
  const { toast, me } = useApp();
  const [reason, setReason] = useState<string>('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (!reason) return;
    setBusy(true);
    const result = db.reportContent({ targetType, targetId, reason, note });
    setBusy(false);
    setReason('');
    setNote('');
    onClose();
    toast(result.ok ? 'Report sent \u2014 our safety team will review it' : (result.error ?? 'Could not send report'));
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Report">
      <Text style={{ color: theme.textMuted, fontSize: 13.5, lineHeight: 20, marginBottom: spacing.lg }}>
        Reports are confidential. {targetLabel ? `You are reporting ${targetLabel}. ` : ''}Tell us what is happening so the moderation team can act quickly.
      </Text>
      <View style={styles.reasonWrap}>
        {REPORT_REASONS.map((r) => (
          <Chip key={r} label={r} active={reason === r} onPress={() => setReason(r)} />
        ))}
      </View>
      <View style={{ marginTop: spacing.lg }}>
        <Field label="Add detail (optional)" value={note} onChangeText={setNote} placeholder="What should the team look at?" multiline maxLength={280} autoCapitalize="sentences" />
      </View>
      <Button label={busy ? 'Sending\u2026' : 'Submit report'} onPress={submit} disabled={!reason} variant="danger" />
      <Text style={{ color: theme.textFaint, fontSize: 12, marginTop: spacing.md, textAlign: 'center' }}>Signed in as @{me?.username}</Text>
    </Sheet>
  );
}

export function UserRow({ user, right, onPress }: { user: import('../lib/types').User; right?: React.ReactNode; onPress?: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.userRow, { backgroundColor: pressed ? theme.surfaceAlt : 'transparent' }]}>
      <Avatar uri={user.avatar} name={user.displayName} size={46} onPress={onPress} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text numberOfLines={1} style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>
            {user.displayName}
          </Text>
          {user.verified ? <Ionicons name="checkmark-circle" size={14} color={theme.brand} /> : null}
        </View>
        <Text numberOfLines={1} style={{ color: theme.textFaint, fontSize: 13 }}>
          @{user.username} \u00b7 {user.category}
        </Text>
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth },
  actionIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reasonWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 4 },
});
