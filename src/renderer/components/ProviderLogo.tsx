import React from 'react';
import { siKlarna, siAfterpay, siPaypal, siApplepay } from 'simple-icons';

export const PROVIDER_COLORS: Record<string, { bg: string; text: string }> = {
  affirm: { bg: '#4A4AF4', text: '#FFFFFF' },
  klarna: { bg: '#FFB3C7', text: '#0A0B09' },
  afterpay: { bg: '#B2FCE4', text: '#000000' },
  paypal: { bg: '#003087', text: '#FFFFFF' },
  apple: { bg: '#000000', text: '#FFFFFF' },
  zip: { bg: '#6941C6', text: '#FFFFFF' },
  other: { bg: '#888888', text: '#FFFFFF' },
};

export const PROVIDER_LABELS: Record<string, string> = {
  affirm: 'Affirm',
  klarna: 'Klarna',
  afterpay: 'Afterpay',
  paypal: 'PayPal',
  apple: 'Apple Pay',
  zip: 'Zip',
  other: 'Plan',
};

export const PROVIDER_OPTIONS = ['affirm', 'klarna', 'afterpay', 'paypal', 'apple', 'zip', 'other'] as const;

// Official brand glyphs (24x24 path data) from the CC0-licensed simple-icons set.
const BRAND_GLYPHS: Record<string, string> = {
  klarna: siKlarna.path,
  afterpay: siAfterpay.path,
  paypal: siPaypal.path,
  apple: siApplepay.path,
};

// Affirm isn't in simple-icons, so use its full-color wordmark (same artwork as
// the mobile app), as inline JSX.
const AffirmMark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 175 129" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M28.5299 125.9C21.2699 114.84 17.0399 101.64 17.0399 87.4498C17.0399 48.6898 48.5699 17.1598 87.3299 17.1598C126.09 17.1598 157.62 48.6898 157.62 87.4498C157.62 101.63 153.38 114.84 146.13 125.9H165.81C171.52 114.29 174.74 101.24 174.74 87.4498C174.74 39.2498 135.53 0.0498047 87.3399 0.0498047C39.1499 0.0498047 -0.0600586 39.2598 -0.0600586 87.4498C-0.0600586 101.24 3.15994 114.29 8.86994 125.9H28.5299Z" fill="#4A4AF4" />
    <path d="M88.5098 45.9199C75.7098 45.9199 60.9798 51.9499 52.9798 58.3299L60.2798 73.6999C66.6898 67.8299 77.0598 62.8199 86.4098 62.8199C95.2998 62.8199 100.2 65.7899 100.2 71.7799C100.2 75.8099 96.9398 78.0799 90.7998 78.6399C67.7398 80.7599 49.8198 87.9599 49.8198 105.66C49.8198 119.7 59.9398 128.18 76.5898 128.18C87.7298 128.18 96.4798 121.99 101.2 113.82V125.89H121.96V75.2999C121.97 54.4099 107.44 45.9199 88.5098 45.9199ZM82.4498 111.96C75.7198 111.96 72.0298 109.08 72.0298 104.35C72.0298 94.4899 84.0798 92.1099 99.7698 92.1099C99.7698 102.43 92.8598 111.96 82.4498 111.96Z" fill="#0A0B09" />
  </svg>
);

interface ProviderLogoProps {
  provider?: string;
  size?: number;
}

const badgeStyle = (size: number, bg: string): React.CSSProperties => ({
  width: size,
  height: size,
  borderRadius: '50%',
  background: bg,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  flexShrink: 0,
});

/**
 * Circular servicer badge for installment-plan providers. Uses the real brand
 * glyph (Affirm's wordmark, or the official simple-icons glyph for
 * Klarna/Afterpay/PayPal/Apple Pay) on the brand's color; falls back to the
 * provider's initial for anything without a glyph (e.g. Zip, Other).
 */
const ProviderLogo: React.FC<ProviderLogoProps> = ({ provider = 'other', size = 28 }) => {
  if (provider === 'affirm') {
    return (
      <span style={badgeStyle(size, '#FFFFFF')}>
        <AffirmMark size={size * 0.62} />
      </span>
    );
  }

  const colors = PROVIDER_COLORS[provider] || PROVIDER_COLORS.other;
  const glyph = BRAND_GLYPHS[provider];

  if (glyph) {
    return (
      <span style={badgeStyle(size, colors.bg)}>
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill={colors.text} xmlns="http://www.w3.org/2000/svg">
          <path d={glyph} />
        </svg>
      </span>
    );
  }

  const label = PROVIDER_LABELS[provider] || provider;
  return (
    <span style={{ ...badgeStyle(size, colors.bg), color: colors.text, fontWeight: 800, fontSize: size * 0.4 }}>
      {label.charAt(0).toUpperCase()}
    </span>
  );
};

export default ProviderLogo;
