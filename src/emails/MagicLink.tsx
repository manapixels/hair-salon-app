import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import React from 'react';

interface MagicLinkEmailProps {
  magicLink: string;
  customerName?: string;
  businessName?: string;
  businessAddress?: string;
}

const main = {
  backgroundColor: '#f5f5f5',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  maxWidth: '500px',
};

const header = {
  background: 'linear-gradient(135deg, #7A6400 0%, #9B8000 100%)',
  padding: '32px',
  textAlign: 'center' as const,
};

const headerTitle = {
  margin: '0',
  color: '#059669', // Updated color from BookingConfirmation
  fontSize: '24px',
  fontWeight: '600',
};

const content = {
  padding: '40px 32px',
};

const greeting = {
  margin: '0 0 8px 0', // Adjusted margin
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600',
};

const text = {
  margin: '0 0 24px 0',
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '1.6',
};

const subtitle = {
  margin: '0',
  color: '#718096',
  fontSize: '16px',
  lineHeight: '1.5',
};

// Updated button style to match BookingConfirmation secondary/primary style
// Since Magic Link only has one primary action, we can use the filled style or outline.
// BookingConfirmation uses outline for "Reschedule" (action) and filled for nothing (?).
// Actually BookingConfirmation uses OUTLINE for Reschedule and GREY for Cancel.
// Let's stick to a filled Primary button for Login as it's the main action.
// But wait, the user removed `buttonPrimary` from BookingConfirmation.
// Let's create a primary button style consistent with the theme colors.
const buttonPrimary = {
  display: 'inline-block',
  backgroundColor: '#7A6400',
  color: '#ffffff',
  textDecoration: 'none',
  padding: '12px 24px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '600',
  border: '2px solid #7A6400',
};

const footer = {
  backgroundColor: '#f9f9f9',
  padding: '24px 32px',
  textAlign: 'center' as const,
  borderTop: '1px solid #eeeeee',
};

const footerText = {
  margin: '0',
  color: '#888888',
  fontSize: '12px',
};

export const MagicLinkEmail = ({
  magicLink = '#',
  customerName,
  businessName = 'Signature Trims',
  businessAddress = '930 Yishun Avenue 1 #01-127, Singapore 760930',
}: MagicLinkEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Log in to {businessName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Section */}
          <Section style={{ textAlign: 'center', padding: '32px 0 16px 0' }}>
            <Img
              src={`https://signaturetrims.com/images/logo.png`} // Improved logo handling
              alt={businessName}
              height="80"
              style={{ margin: '0 auto' }}
            />
          </Section>

          <Section style={{ textAlign: 'center', padding: '2px 0' }}>
            <Text style={greeting}>Hi {customerName || 'there'}</Text>
          </Section>

          {/* Heading */}
          <Section style={{ textAlign: 'center', padding: '0 32px' }}>
            <Heading style={headerTitle}>Log in to {businessName}</Heading>
            <Text style={subtitle}>Click the button below to sign in.</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={text}>This magic link will expire in 15 minutes.</Text>

            <Section style={{ textAlign: 'center', marginTop: '24px', marginBottom: '24px' }}>
              <Button href={magicLink} style={buttonPrimary}>
                Log In Now
              </Button>
            </Section>

            <Text style={{ ...text, fontSize: '14px', color: '#888888' }}>
              If you didn&apos;t request this login link, you can safely ignore this email.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={{ ...footerText, marginBottom: '8px' }}>{businessName}</Text>
            <Text style={{ ...footerText, color: '#aaaaaa' }}>{businessAddress}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default MagicLinkEmail;
