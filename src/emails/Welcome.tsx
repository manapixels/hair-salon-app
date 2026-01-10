import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import React from 'react';

interface WelcomeEmailProps {
  customerName: string;
  loginUrl: string;
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

// Removed gradient header to match BookingConfirmation

const headerTitle = {
  margin: '0',
  color: '#059669', // Updated to match BookingConfirmation
  fontSize: '24px',
  fontWeight: '600',
};

const content = {
  padding: '40px 32px',
};

const greeting = {
  margin: '0 0 8px 0',
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

export const WelcomeEmail = ({
  customerName = 'Guest',
  loginUrl = '#',
  businessName = 'Signature Trims',
  businessAddress = '930 Yishun Avenue 1 #01-127, Singapore 760930',
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {businessName}!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Section */}
          <Section style={{ textAlign: 'center', padding: '32px 0 16px 0' }}>
            <Img
              src={`https://signaturetrims.com/images/logo.png`}
              alt={businessName}
              height="80"
              style={{ margin: '0 auto' }}
            />
          </Section>

          <Section style={{ textAlign: 'center', padding: '2px 0' }}>
            <Text style={greeting}>Hi {customerName}</Text>
          </Section>

          {/* Heading */}
          <Section style={{ textAlign: 'center', padding: '0 32px' }}>
            <Heading style={headerTitle}>Welcome to {businessName}!</Heading>
            <Text style={subtitle}>We&apos;re excited to have you with us.</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={text}>
              We&apos;ve created an account for you so you can easily manage your upcoming
              appointments.
            </Text>
            <Text style={text}>
              You can log in at any time using your email address. We use secure magic links, so you
              don&apos;t need to remember another password.
            </Text>

            <Section style={{ textAlign: 'center', marginTop: '32px', marginBottom: '32px' }}>
              <Button href={loginUrl} style={buttonPrimary}>
                Log In to Your Account
              </Button>
            </Section>

            <Text style={{ ...text, fontSize: '14px', color: '#888888' }}>
              If you have any questions, feel free to reply to this email.
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

export default WelcomeEmail;
