import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { useStore } from '../store/AppStore';
import { walletBalance, walletPending } from '../store/selectors';
import { Button, Card, Chip, EmptyState, IconBtn, Pill, SectionTitle, useToast } from '../components/ui';
import { BottomSheet } from './WatchScreen';
import { fmtMoney, timeAgo } from '../lib/format';
import type { Nav } from '../navigation/types';

const TX_ICON: Record<string, { icon: 'trending-up' | 'gift' | 'people' | 'megaphone' | 'arrow-down'; tint: string }> = {
  ad_share: { icon: 'trending-up', tint: '#25D0A4' },
  reward: { icon: 'trending-up', tint: '#4C8DFF' },
  gift: { icon: 'gift', tint: '#FB5C7E' },
  subscription: { icon: 'people', tint: '#7C5CFF' },
  sponsor: { icon: 'megaphone', tint: '#FFB020' },
  withdrawal: { icon: 'arrow-down', tint: '#E23D63' },
};

const METHODS = ['Bank transfer', 'Mobile money', 'PayPal'];

/**
 * Creator wallet. No sensitive payment data is ever stored in the app —
 * payouts run through a licensed payment provider with KYC verification.
 */
export const WalletScreen: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, me, requestWithdrawal } = useStore();

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(METHODS[0]);
  const [error, setError] = useState<string | null>(null);

  const meId = me?.id ?? '';
  const balance = useMemo(() => walletBalance(state, meId), [state, meId]);
  const pending = useMemo(() => walletPending(state, meId), [state, meId]);
  const txs = state.wallet.filter((w) => w.userId === meId).sort((a, b) => b.at - a.at);
  const withdrawals = state.withdrawals.filter((w) => w.userId === meId).sort((a, b) => b.at - a.at);

  const submit = () => {
    setError(null);
    const value = Number(amount.replace(/[^0-9.]/g, ''));
    if (!value || isNaN(value)) return setError('Enter an amount.');
    const res = requestWithdrawal(value, method);
    if (!res.ok) return setError(res.error.message);
    setWithdrawOpen(false);
    setAmount('');
    toast.show('Withdrawal requested. Status: pending review.', 'wallet');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <View style={styles.bar}>
        <IconBtn name="chevron-back" accessibilityLabel="Go back" onPress={() => nav.goBack()} />
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 17 }}>Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(260)}>
          <LinearGradient colors={['#221C4A', '#6A45FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balance}>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12.5 }}>Available balance</Text>
            <Text style={{ color: '#fff', fontSize: 38, fontWeight: '800', letterSpacing: -1.2, marginTop: 6 }}>
              {fmtMoney(balance)}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <View style={styles.badge}>
                <Ionicons name="time-outline" size={13} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{fmtMoney(pending)} pending</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="shield-checkmark-outline" size={13} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Verified creator</Text>
              </View>
            </View>
            <Button
              title="Request withdrawal"
              icon="arrow-down-circle-outline"
              size="lg"
              full
              style={{ marginTop: 18, backgroundColor: 'rgba(255,255,255,0.16)' }}
              onPress={() => setWithdrawOpen(true)}
            />
          </LinearGradient>
        </Animated.View>

        <View style={{ marginTop: 22 }}>
          <SectionTitle title="Payout status" />
          {withdrawals.length === 0 ? (
            <EmptyState icon="wallet-outline" title="No withdrawal requests" subtitle="Request a payout once your balance clears verification." />
          ) : (
            withdrawals.map((w, i) => (
              <Animated.View key={w.id} entering={FadeInDown.delay(i * 40).duration(220)}>
                <Card style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{w.method}</Text>
                      <Text style={{ color: theme.textFaint, fontSize: 11.5, marginTop: 3 }}>
                        {timeAgo(w.at)} ago · {w.note}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15 }}>{fmtMoney(w.amount)}</Text>
                      <Pill
                        text={w.status}
                        color={
                          w.status === 'completed' ? theme.success
                          : w.status === 'rejected' ? theme.danger
                          : theme.warn
                        }
                      />
                    </View>
                  </View>
                </Card>
              </Animated.View>
            ))
          )}
        </View>

        <View style={{ marginTop: 22 }}>
          <SectionTitle title="Transactions" />
          {txs.length === 0 ? (
            <EmptyState icon="receipt-outline" title="No transactions yet" subtitle="Gifts, ad-share and rewards will appear here." />
          ) : (
            txs.map((t, i) => {
              const meta = TX_ICON[t.kind] ?? TX_ICON.reward;
              return (
                <Animated.View key={t.id} entering={FadeInDown.delay(Math.min(i, 8) * 35).duration(220)}>
                  <View style={[styles.tx, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.txIcon, { backgroundColor: `${meta.tint}22` }]}>
                      <Ionicons name={meta.icon} size={17} color={meta.tint} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text numberOfLines={1} style={{ color: theme.text, fontWeight: '700', fontSize: 13.5 }}>
                        {t.title}
                      </Text>
                      <Text style={{ color: theme.textFaint, fontSize: 11.5, marginTop: 2 }}>
                        {timeAgo(t.at)} ago{t.ref ? ` · ${t.ref}` : ''}{t.isDemo ? ' · DEMO' : ''}
                      </Text>
                      {t.note ? (
                        <Text numberOfLines={2} style={{ color: theme.textFaint, fontSize: 11, marginTop: 3 }}>
                          {t.note}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 5 }}>
                      <Text style={{ color: t.amount >= 0 ? theme.success : theme.text, fontWeight: '800', fontSize: 14.5 }}>
                        {t.amount >= 0 ? '+' : ''}{fmtMoney(t.amount)}
                      </Text>
                      <Pill
                        text={t.status}
                        color={t.status === 'completed' ? theme.success : t.status === 'failed' ? theme.danger : theme.warn}
                      />
                    </View>
                  </View>
                </Animated.View>
              );
            })
          )}
        </View>

        <Card style={{ marginTop: 20, backgroundColor: theme.primarySoft, borderColor: 'transparent' }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Ionicons name="shield-checkmark-outline" size={18} color={theme.primary} />
            <Text style={{ color: theme.text, fontSize: 11.5, lineHeight: 17, flex: 1 }}>
              VibeConnect never stores bank details, cards or wallet keys in the app. Payouts are processed by our
              licensed payment provider after identity verification (KYC/AML). Balances shown are provisional until
              the provider confirms, and earnings are not guaranteed.
            </Text>
          </View>
          <Button
            title="Read the monetisation policy"
            size="sm"
            variant="ghost"
            style={{ marginTop: 12 }}
            onPress={() => nav.navigate('Legal', { doc: 'monetization' })}
          />
        </Card>
      </ScrollView>

      {withdrawOpen && (
        <BottomSheet title="Request a withdrawal" onClose={() => setWithdrawOpen(false)}>
          <Text style={{ color: theme.textDim, fontSize: 13, marginBottom: 14 }}>
            Available {fmtMoney(balance)} · minimum $50.00 per request.
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={theme.textFaint}
            style={[styles.amount, { backgroundColor: theme.surface, color: theme.text, borderColor: error ? theme.danger : theme.border }]}
            accessibilityLabel="Withdrawal amount"
          />
          {error && <Text style={{ color: theme.danger, fontSize: 12.5, marginBottom: 10, marginLeft: 4 }}>{error}</Text>}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {METHODS.map((m) => (
              <Chip key={m} label={m} active={method === m} onPress={() => setMethod(m)} />
            ))}
          </View>
          <Text style={{ color: theme.textFaint, fontSize: 11.5, lineHeight: 17, marginBottom: 14 }}>
            Requests are reviewed for eligibility and fraud checks, then paid by our provider. Processing usually takes
            3-5 business days. We never ask for your banking password.
          </Text>
          <Button title="Submit request" full onPress={submit} />
        </BottomSheet>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  balance: { borderRadius: 26, padding: 22 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6,
  },
  tx: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 18, borderWidth: 1, marginBottom: 10 },
  txIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  amount: { borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14, fontSize: 22, fontWeight: '800', marginBottom: 12 },
});
