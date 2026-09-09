import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as db from '../../lib/db';
import { useApp, useTheme } from '../../lib/store';
import { gradients, radii, shadow, spacing } from '../../lib/theme';
import { formatDateTime, money } from '../../lib/format';
import { config } from '../../lib/config';
import { AppHeader } from '../../components/Screen';
import { Banner, Button, Chip, EmptyState, Field, SectionTitle, Sheet } from '../../components/UI';
import { validateAccountNumber } from '../../lib/validation';

type Filter = 'all' | 'earning' | 'payout' | 'tip';

export function WalletScreen() {
  const theme = useTheme();
  const { me, db: store, toast, version } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [methodsOpen, setMethodsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [methodId, setMethodId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [newKind, setNewKind] = useState<'bank' | 'card'>('bank');
  const [newLabel, setNewLabel] = useState('');
  const [newAccount, setNewAccount] = useState('');
  const [newError, setNewError] = useState('');

  const transactions = useMemo(() => (me ? db.transactionsFor(me.id, filter) : []), [me, filter, version]);
  const methods = useMemo(() => (me ? db.payoutMethodsFor(me.id) : []), [me, version]);

  if (!me || !store) return null;

  const balance = db.walletBalance(me.id);
  const pending = transactions.filter((t) => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
  const earnedThisMonth = transactions.filter((t) => t.amount > 0 && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const activeMethod = methods.find((m) => m.id === methodId) ?? methods.find((m) => m.isDefault) ?? methods[0];

  const submitWithdraw = async () => {
    setAmountError('');
    const value = Number(amount.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(value) || value <= 0) {
      setAmountError('Enter an amount greater than zero');
      return;
    }
    if (!activeMethod) {
      setAmountError('Add a payout method first');
      return;
    }
    setBusy(true);
    const result = db.requestPayout(value, activeMethod.id);
    setBusy(false);
    if (!result.ok) {
      setAmountError(result.error ?? 'Could not start the payout');
      return;
    }
    setAmount('');
    setWithdrawOpen(false);
    toast('Payout queued \u2014 settles in 2\u20133 business days');
  };

  const submitTopUp = async () => {
    setAmountError('');
    const value = Number(amount.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(value) || value <= 0) {
      setAmountError('Enter an amount greater than zero');
      return;
    }
    db.addFunds(value, 'Wallet top-up (demo ledger)');
    setAmount('');
    setTopUpOpen(false);
    toast(`Added ${money(value)} to your wallet`);
  };

  const submitMethod = () => {
    setNewError('');
    const check = validateAccountNumber(newAccount);
    if (!check.ok) {
      setNewError(check.message ?? 'Check the account number');
      return;
    }
    if (!newLabel.trim()) {
      setNewError('Give this method a name');
      return;
    }
    db.addPayoutMethod({ kind: newKind, label: newLabel, accountNumber: newAccount, brand: newKind === 'card' ? 'Card' : undefined });
    setNewLabel('');
    setNewAccount('');
    setMethodsOpen(false);
    toast('Payout method saved');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title="Wallet" subtitle="Balance, ledger and payouts" />
      <FlatList
        data={transactions}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <LinearGradient colors={gradients.brand as unknown as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.balance, shadow(10, theme)]}>
              <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
              <Text style={styles.balanceValue}>{money(me.monetization.status === 'approved' ? balance : 0)}</Text>
              <View style={{ flexDirection: 'row', gap: 20, marginTop: 14 }}>
                <View>
                  <Text style={styles.miniLabel}>Pending</Text>
                  <Text style={styles.miniValue}>{money(me.monetization.status === 'approved' ? pending : 0)}</Text>
                </View>
                <View>
                  <Text style={styles.miniLabel}>Earned (all time)</Text>
                  <Text style={styles.miniValue}>{money(me.monetization.status === 'approved' ? earnedThisMonth : 0)}</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.lg }}>
              <Button label="Withdraw" icon="arrow-down-circle-outline" size="sm" onPress={() => setWithdrawOpen(true)} style={{ flex: 1 }} />
              <Button label="Add funds" icon="add-circle-outline" variant="secondary" size="sm" onPress={() => setTopUpOpen(true)} style={{ flex: 1 }} />
              <Button label="Methods" icon="card-outline" variant="secondary" size="sm" onPress={() => setMethodsOpen(true)} style={{ flex: 1 }} />
            </View>

            {me.monetization.status !== 'approved' ? (
              <View style={{ marginTop: spacing.lg }}>
                <Banner
                  text="Payouts are locked until a moderator approves your creator monetization application. Your ledger still records every view and tip as you grow."
                  icon="lock-closed-outline"
                  tone="warning"
                />
              </View>
            ) : null}
            {config.paymentsPublicKey ? null : (
              <Banner text={`Money movement is handled by a payment processor. Set the processor key server-side and EXPO_PUBLIC_PAYMENTS_PUBLIC_KEY here \u2014 the ledger, limits and approvals already work.`} icon="information-circle-outline" />
            )}

            <View style={{ marginTop: spacing.sm, marginBottom: spacing.md }}>
              <SectionTitle title="Transactions" />
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
                <Chip label="Earnings" active={filter === 'earning'} onPress={() => setFilter('earning')} />
                <Chip label="Tips" active={filter === 'tip'} onPress={() => setFilter('tip')} />
                <Chip label="Payouts" active={filter === 'payout'} onPress={() => setFilter('payout')} />
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="No transactions yet" subtitle="Ad share, tips and payouts will appear here as soon as you earn." />}
        renderItem={({ item }) => {
          const positive = item.amount > 0;
          const icon = item.kind === 'payout' ? 'arrow-up-circle' : item.kind === 'tip' ? 'heart' : item.kind === 'bonus' ? 'gift' : 'trending-up';
          const tint = positive ? theme.success : theme.danger;
          return (
            <View style={[styles.txn, { borderColor: theme.divider }]}>
              <View style={[styles.txnIcon, { backgroundColor: theme.dark ? `${tint}1F` : `${tint}14` }]}>
                <Ionicons name={icon as any} size={17} color={tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{item.label}</Text>
                <Text style={{ color: theme.textFaint, fontSize: 12, marginTop: 2 }}>{formatDateTime(item.createdAt)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: tint, fontWeight: '800', fontSize: 14.5 }}>
                  {positive ? '+' : ''}
                  {money(item.amount)}
                </Text>
                <Text style={{ color: item.status === 'completed' ? theme.textFaint : theme.warning, fontSize: 11.5, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' }}>{item.status}</Text>
              </View>
            </View>
          );
        }}
      />

      <Sheet visible={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Withdraw funds">
        <Banner text={`Minimum withdrawal is ${money(config.minPayout)}. Transfers settle in 2\u20133 business days.`} icon="time-outline" />
        <Field
          label="Amount (USD)"
          value={amount}
          onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
          placeholder="50.00"
          keyboardType="decimal-pad"
          icon="cash-outline"
          error={amountError || undefined}
          hint={`Available: ${money(me.monetization.status === 'approved' ? balance : 0)}`}
        />
        {methods.length > 0 ? (
          <>
            <Text style={{ color: theme.textMuted, fontSize: 12.5, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 }}>Send to</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: spacing.lg }}>
              {methods.map((method) => (
                <Chip key={method.id} label={`${method.label} \u2022\u2022\u2022\u2022 ${method.last4}`} active={activeMethod?.id === method.id} onPress={() => setMethodId(method.id)} icon={method.kind === 'bank' ? 'business-outline' : 'card-outline'} />
              ))}
            </View>
          </>
        ) : (
          <Banner text="No payout method yet \u2014 add one from the Methods button first." tone="warning" icon="card-outline" />
        )}
        <Button label="Request payout" loading={busy} onPress={submitWithdraw} />
      </Sheet>

      <Sheet visible={topUpOpen} onClose={() => setTopUpOpen(false)} title="Add funds">
        <Banner text="This build records a demo ledger entry. In production this charges a saved card through the payment processor." icon="flask-outline" />
        <Field label="Amount (USD)" value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))} placeholder="25.00" keyboardType="decimal-pad" icon="cash-outline" error={amountError || undefined} />
        <Button label="Add to wallet" onPress={submitTopUp} />
      </Sheet>

      <Sheet visible={methodsOpen} onClose={() => setMethodsOpen(false)} title="Payout methods">
        {methods.map((method) => (
          <View key={method.id} style={[styles.methodRow, { borderColor: theme.divider }]}>
            <View style={[styles.txnIcon, { backgroundColor: theme.surfaceAlt }]}>
              <Ionicons name={method.kind === 'bank' ? 'business-outline' : 'card-outline'} size={17} color={theme.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{method.label}</Text>
              <Text style={{ color: theme.textFaint, fontSize: 12.5, marginTop: 2 }}>
                {method.kind === 'bank' ? 'Bank account' : method.brand ?? 'Card'} \u2022\u2022\u2022\u2022 {method.last4}
                {method.isDefault ? ' \u00b7 default' : ''}
              </Text>
            </View>
            <Button
              label={method.isDefault ? 'Default' : 'Set default'}
              variant="ghost"
              size="sm"
              full={false}
              onPress={() => {
                db.setDefaultPayoutMethod(method.id);
                toast('Default payout method updated');
              }}
              style={{ width: 100 }}
            />
            <Button
              label="Remove"
              variant="ghost"
              size="sm"
              full={false}
              onPress={() => {
                db.removePayoutMethod(method.id);
                toast('Payout method removed');
              }}
              style={{ width: 82 }}
            />
          </View>
        ))}
        <View style={{ height: spacing.lg }} />
        <SectionTitle title="Add a method" />
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.md }}>
          <Chip label="Bank account" icon="business-outline" active={newKind === 'bank'} onPress={() => setNewKind('bank')} />
          <Chip label="Debit card" icon="card-outline" active={newKind === 'card'} onPress={() => setNewKind('card')} />
        </View>
        <Field label="Label" value={newLabel} onChangeText={setNewLabel} placeholder={newKind === 'bank' ? 'Meridian Credit Union' : 'Everyday debit'} icon="pricetag-outline" autoCapitalize="words" />
        <Field
          label="Account number"
          value={newAccount}
          onChangeText={setNewAccount}
          placeholder={newKind === 'bank' ? 'Account number' : 'Card number'}
          keyboardType="number-pad"
          icon="keypad-outline"
          error={newError || undefined}
          hint="Only the last four digits are stored on this device."
          maxLength={19}
        />
        <Button label="Save payout method" onPress={submitMethod} />
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  balance: { borderRadius: radii.xl, padding: spacing.xl },
  balanceLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  balanceValue: { color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: -1.4, marginTop: 6 },
  miniLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11.5, fontWeight: '600' },
  miniValue: { color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 2 },
  txn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  txnIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});
