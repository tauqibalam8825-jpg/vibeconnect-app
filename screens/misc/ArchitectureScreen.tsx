import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/store';
import { radii, spacing } from '../../lib/theme';
import { AppHeader } from '../../components/Screen';
import { Banner, Card, SectionTitle } from '../../components/UI';
import { featureMatrix, isServiceConfigured } from '../../lib/config';
import { COLLECTIONS, PHASES } from '../../lib/schema';

/**
 * In-app architecture reference: what is fully functional today, what needs an
 * external service, and how the data model is laid out.
 */
export function ArchitectureScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title="Architecture" subtitle="VibeConnect platform reference" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Banner
          text="Everything in this build runs on-device against the same collection shapes a hosted backend would expose. Point the EXPO_PUBLIC_* endpoints at your API and the same screens talk to the server."
          icon="layers-outline"
        />

        <SectionTitle title="Build phases" />
        {PHASES.map((phase) => (
          <Card key={phase.phase} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.phaseBadge, { backgroundColor: phase.status === 'shipped' ? theme.dark ? `${theme.success}22` : `${theme.success}1A` : `${theme.warning}1F` }]}>
                <Text style={{ color: phase.status === 'shipped' ? theme.success : theme.warning, fontWeight: '900', fontSize: 11 }}>
                  PHASE {phase.phase}
                </Text>
              </View>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15.5, flex: 1 }}>{phase.name}</Text>
              <Text style={{ color: phase.status === 'shipped' ? theme.success : theme.warning, fontSize: 11.5, fontWeight: '800' }}>
                {phase.status === 'shipped' ? 'SHIPPED' : 'IN PROGRESS'}
              </Text>
            </View>
            <View style={{ marginTop: 10, gap: 6 }}>
              {phase.items.map((item) => (
                <View key={item} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <Ionicons name="checkmark-circle" size={14} color={phase.status === 'shipped' ? theme.success : theme.textFaint} style={{ marginTop: 2 }} />
                  <Text style={{ color: theme.textMuted, fontSize: 13, flex: 1, lineHeight: 18 }}>{item}</Text>
                </View>
              ))}
            </View>
          </Card>
        ))}

        <View style={{ marginTop: spacing.lg }}>
          <SectionTitle title="Feature status" />
          {featureMatrix.map((feature) => {
            const ready = feature.status === 'live' || isServiceConfigured(feature.key);
            return (
              <View key={feature.key} style={[styles.featureRow, { borderColor: theme.divider }]}>
                <View style={[styles.featureDot, { backgroundColor: ready ? theme.success : theme.warning }]} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{feature.label}</Text>
                  <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 3, lineHeight: 17 }}>{feature.detail}</Text>
                  {feature.envVar ? (
                    <Text style={{ color: ready ? theme.success : theme.warning, fontSize: 11.5, fontWeight: '800', marginTop: 5 }}>
                      {ready ? 'CONFIGURED' : `NEEDS ${feature.envVar}`}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <SectionTitle title="Database structure" />
          {COLLECTIONS.map((collection) => (
            <Card key={collection.name} style={{ marginBottom: spacing.md }}>
              <Text style={{ color: theme.brand, fontWeight: '800', fontSize: 14.5 }}>{collection.name}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 12.5, marginTop: 6, lineHeight: 18 }}>{collection.fields.join(' \u00b7 ')}</Text>
              <View style={{ marginTop: 8 }}>
                {collection.indexes.map((index) => (
                  <Text key={index} style={{ color: theme.textFaint, fontSize: 12, lineHeight: 17 }}>
                    \u2022 {index}
                  </Text>
                ))}
              </View>
              <Text style={{ color: theme.textFaint, fontSize: 12, marginTop: 8, fontStyle: 'italic', lineHeight: 17 }}>{collection.notes}</Text>
            </Card>
          ))}
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <SectionTitle title="Security posture" />
          <Card>
            {[
              'Secrets never enter the client bundle \u2014 only EXPO_PUBLIC_* endpoints do.',
              'Passwords are salted and stretched before storage; plain text is never kept.',
              'Sessions use a random token held in the Keychain / Keystore (SecureStore).',
              'Media uploads go through signed URLs so bucket credentials stay server-side.',
              'Wallet balances are derived from an append-only ledger, never stored as a number.',
              'Moderation is role-checked on every admin mutation.',
            ].map((line) => (
              <View key={line} style={{ flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
                <Ionicons name="lock-closed" size={13} color={theme.success} style={{ marginTop: 3 }} />
                <Text style={{ color: theme.textMuted, fontSize: 13, flex: 1, lineHeight: 18 }}>{line}</Text>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  phaseBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.sm },
  featureRow: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  featureDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
