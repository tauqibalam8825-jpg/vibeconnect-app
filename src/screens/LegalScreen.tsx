import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { Card, IconBtn } from '../components/ui';
import type { Nav } from '../navigation/types';

type Doc = { title: string; updated: string; intro: string; sections: { heading: string; body: string }[] };

const DOCS: Record<string, Doc> = {
  guidelines: {
    title: 'Community Guidelines',
    updated: 'Updated August 2026',
    intro:
      'VibeConnect is for real people sharing real moments. These rules keep it that way, and they apply to every post, vibe, video, story and message.',
    sections: [
      { heading: 'Be human, be respectful', body: 'No harassment, bullying, threats, or sexualised abuse. Critique ideas, not people. Do not incite others to harass someone.' },
      { heading: 'No hate or discrimination', body: 'Content that attacks or demeans people based on identity — including race, ethnicity, religion, disability, gender, sexual orientation or nationality — is removed and may lead to a permanent ban.' },
      { heading: 'Keep it legal and safe', body: 'No violence, dangerous acts, sale of regulated goods, or content that sexualises minors. Anything illegal in your jurisdiction is not allowed here.' },
      { heading: 'Authentic content only', body: 'Post content you made or have rights to. Synthentic media that is likely to mislead must be labelled. Do not impersonate people or organisations.' },
      { heading: 'Spam and scams', body: 'No deceptive links, phishing, fake engagement pods, or automated comments. Promote your work, do not harass people with it.' },
      { heading: 'How moderation works', body: 'Reports are reviewed by our safety team and, where needed, automated systems. You can appeal a decision from the notification you receive. Content may be limited or removed before you are notified when there is a risk of harm.' },
      { heading: 'Enforcement ladder', body: 'A warning, reduced reach, temporary restriction, suspension, or permanent removal — depending on severity, history and intent. Some violations are removed on first sight.' },
    ],
  },
  terms: {
    title: 'Terms of Service',
    updated: 'Updated August 2026',
    intro: 'These terms form the agreement between you and VibeConnect when you use the app, website and related services.',
    sections: [
      { heading: 'Your account', body: 'You must be at least 13 years old (or the minimum age in your country). You are responsible for your credentials and for activity under your account. Usernames are unique and may be released only after account deletion.' },
      { heading: 'Your content', body: 'You keep ownership of what you post. You grant VibeConnect a worldwide, non-exclusive licence to host, reproduce and display that content solely to operate and promote the service, ending when you delete it except for copies held by people you shared it with.' },
      { heading: 'Acceptable use', body: 'Do not break the law, probe our systems, scrape at scale, or interfere with other people s use of the service. We may suspend accounts that do.' },
      { heading: 'Moderation and removal', body: 'We may remove content or restrict accounts that breach the Community Guidelines or applicable law, and will provide reasons wherever we can.' },
      { heading: 'Service availability', body: 'The service may change, pause or be discontinued. To the extent permitted by law we are not liable for indirect or consequential losses.' },
      { heading: 'Disclaimers and liability', body: 'The service is provided as is. Creator earnings, reach and engagement are not guaranteed and may change. Nothing in these terms limits liability that cannot be limited by law.' },
      { heading: 'Contact', body: 'Questions about these terms: legal@vibeconnect.app.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'Updated August 2026',
    intro: 'This policy explains what we collect, why, and the choices you have. We collect the minimum needed to run a social platform.',
    sections: [
      { heading: 'What we collect', body: 'Account data you provide (email, username, display name, bio, avatar), content you publish, your interactions (likes, comments, follows, saves), messages you send, and device information such as app version and coarse region.' },
      { heading: 'Messages', body: 'Private messages are encrypted in transit and are never shown to other accounts, moderators only review content you explicitly report, with an audit trail.' },
      { heading: 'Payments', body: 'We never store bank details, cards or wallet keys in the app. Payouts are handled by a licensed payment provider that performs identity verification under KYC and AML rules.' },
      { heading: 'How we use data', body: 'To operate the service, personalise your feed, prevent abuse, measure creator analytics in aggregate, and comply with legal obligations. We do not sell personal data.' },
      { heading: 'Your controls', body: 'Switch your account to private, mute or block accounts, download or delete your content, and delete your account at any time from Settings. Deleting removes your profile within 30 days.' },
      { heading: 'Retention', body: 'Content is retained until you delete it. Backup copies expire within 90 days. Records required for legal compliance are kept as long as legally mandated.' },
      { heading: 'Contact', body: 'Data protection questions: privacy@vibeconnect.app.' },
    ],
  },
  monetization: {
    title: 'Creator Monetisation Policy',
    updated: 'Updated August 2026',
    intro:
      'VibeConnect offers several ways for eligible creators to earn. Nothing on this page is a promise of income — all earnings depend on eligibility, platform rules, available revenue and applicable law.',
    sections: [
      { heading: 'Ad revenue sharing', body: 'Creators may receive a share of advertising revenue generated from eligible views on long videos and vibes. Rates vary by region, season, advertiser demand and content suitability, and are reviewed periodically.' },
      { heading: 'Channel subscriptions', body: 'Creators can offer monthly memberships with perks. VibeConnect takes a platform fee before payout; the rest is credited to the creator wallet monthly.' },
      { heading: 'Gifts and tips', body: 'Viewers can send one-off gifts. Gifts are final except where required by law, and creators receive funds after the payment provider settles them.' },
      { heading: 'Sponsored content', body: 'Brand partnerships must be disclosed using the sponsored label. Undisclosed advertising is a guideline violation.' },
      { heading: 'Eligibility', body: 'Requirements include creator mode enabled, an account in good standing, identity verification with our payment provider, and content that follows the Community Guidelines. Eligibility is assessed continuously, not once.' },
      { heading: 'Payments', body: 'Payouts run through our licensed payment provider after KYC/AML verification. Minimum withdrawal thresholds, processing windows (typically 3-5 business days) and tax reporting obligations vary by country.' },
      { heading: 'No guarantees', body: 'Views, engagement and revenue can go up or down. Suspension for guideline violations stops monetisation immediately, and balances held for fraud or chargebacks may be forfeited where the law allows.' },
    ],
  },
};

export const LegalScreen: React.FC<{ nav: Nav; doc: 'terms' | 'privacy' | 'guidelines' | 'monetization' }> = ({ nav, doc }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const d = DOCS[doc] ?? DOCS.terms;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <View style={styles.bar}>
        <IconBtn name="chevron-back" accessibilityLabel="Go back" onPress={() => nav.goBack()} />
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 17 }} numberOfLines={1}>
          {d.title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Ionicons name="document-text-outline" size={16} color={theme.primary} />
          <Text style={{ color: theme.textFaint, fontSize: 12 }}>{d.updated}</Text>
        </View>
        <Text style={{ color: theme.text, fontSize: 15, lineHeight: 23, marginBottom: 18, fontWeight: '600' }}>
          {d.intro}
        </Text>
        {d.sections.map((s) => (
          <Card key={s.heading} style={{ marginBottom: 12 }}>
            <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15, marginBottom: 8 }}>{s.heading}</Text>
            <Text style={{ color: theme.textDim, fontSize: 13.5, lineHeight: 21 }}>{s.body}</Text>
          </Card>
        ))}
        <Text style={{ color: theme.textFaint, fontSize: 11.5, textAlign: 'center', marginTop: 10, lineHeight: 17 }}>
          This preview text is illustrative. Final legal documents must be reviewed by counsel before launch.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
});
