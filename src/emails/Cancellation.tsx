import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface CancellationEmailProps {
  customerName: string;
  date: string;
  time: string;
  serviceName: string;
  stylistName?: string;
  reason?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  baseUrl?: string;
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

const headerTitle = {
  margin: '0',
  color: '#dc2626',
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

const card = {
  backgroundColor: '#fef2f2',
  borderRadius: '12px',
  border: '1px solid #fecaca',
  marginBottom: '24px',
  padding: '16px',
};

const label = {
  color: '#718096',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0',
};

const value = {
  margin: '0',
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '600',
  textAlign: 'right' as const,
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

const contactText = {
  fontSize: '14px',
  color: '#a0aec0',
  textAlign: 'center' as const,
  marginTop: '32px',
};

const reasonSection = {
  padding: '12px 0 0',
  borderTop: '1px solid #fecaca',
  marginTop: '12px',
};

const reasonLabel = {
  fontSize: '12px',
  color: '#71717a',
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
};

const reasonText = {
  fontSize: '14px',
  color: '#52525b',
  fontStyle: 'italic' as const,
  margin: '0',
};

export default function CancellationEmail({
  customerName = 'Valued Customer',
  date = 'January 10, 2026',
  time = '2:00 PM',
  serviceName = 'Hair Service',
  stylistName,
  reason,
  businessName = 'Signature Trims',
  businessAddress = '930 Yishun Avenue 1 #01-127, Singapore 760930',
  businessPhone = '+65 8022 2338',
  baseUrl = 'https://signaturetrims.com',
}: CancellationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your appointment on {date} has been cancelled</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Section */}
          <Section style={{ textAlign: 'center', padding: '32px 0 16px 0' }}>
            <Img
              src={`${baseUrl}/images/logo.png`}
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
            <Heading style={headerTitle}>Appointment Cancelled</Heading>
            <Text style={subtitle}>
              We&apos;re sorry to inform you that your appointment has been cancelled.
            </Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            {/* Appointment Card */}
            <Section style={card}>
              <Section
                style={{
                  paddingBottom: '12px',
                  borderBottom: '1px solid #fecaca',
                  marginBottom: '12px',
                }}
              >
                <Row>
                  <Column style={{ width: '100px' }}>
                    <Text style={label}>Service</Text>
                  </Column>
                  <Column style={{ textAlign: 'right' }}>
                    <Text style={value}>{serviceName}</Text>
                  </Column>
                </Row>
              </Section>

              <Row style={{ marginBottom: '8px' }}>
                <Column style={{ width: '100px' }}>
                  <Text style={label}>Date</Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={value}>{date}</Text>
                </Column>
              </Row>

              <Row style={{ marginBottom: '8px' }}>
                <Column style={{ width: '100px' }}>
                  <Text style={label}>Time</Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={value}>{time}</Text>
                </Column>
              </Row>

              {stylistName && (
                <Row
                  style={{
                    paddingTop: '12px',
                    marginTop: '4px',
                    borderTop: '1px solid #fecaca',
                  }}
                >
                  <Column style={{ width: '100px' }}>
                    <Text style={label}>Stylist</Text>
                  </Column>
                  <Column style={{ textAlign: 'right' }}>
                    <Text style={value}>{stylistName}</Text>
                  </Column>
                </Row>
              )}

              {reason && (
                <Section style={reasonSection}>
                  <Text style={reasonLabel}>Reason</Text>
                  <Text style={reasonText}>{reason}</Text>
                </Section>
              )}
            </Section>

            <Text style={{ ...text, marginBottom: '0' }}>
              We apologize for any inconvenience this may cause. Please feel free to book a new
              appointment at your convenience.
            </Text>

            <Text style={contactText}>
              Need help? Reply to this email or WhatsApp us at {businessPhone}.
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
}
