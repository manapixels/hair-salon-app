import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
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

export default function CancellationEmail({
  customerName = 'Valued Customer',
  date = 'January 10, 2026',
  time = '2:00 PM',
  serviceName = 'Hair Service',
  stylistName,
  reason,
  businessName = 'Signature Trims Hair Salon',
  businessAddress = '930 Yishun Avenue 1 #01-127, Singapore 760930',
  businessPhone = '+65 9126 3421',
  baseUrl = 'https://signaturetrims.com',
}: CancellationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your appointment on {date} has been cancelled</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={headerSection}>
            <Img
              src={`${baseUrl}/logo.png`}
              width="60"
              height="60"
              alt={businessName}
              style={logo}
            />
            <Text style={subtitle}>{businessName}</Text>
          </Section>

          {/* Cancellation Icon */}
          <Section style={iconSection}>
            <div style={cancelIconCircle}>
              <Text style={cancelIcon}>✕</Text>
            </div>
          </Section>

          {/* Main Content */}
          <Section style={contentSection}>
            <Heading style={heading}>Appointment Cancelled</Heading>
            <Text style={greeting}>Hi {customerName},</Text>
            <Text style={text}>
              We&apos;re sorry to inform you that your appointment has been cancelled.
            </Text>

            {/* Appointment Details */}
            <Section style={detailsCard}>
              <Text style={detailsTitle}>Cancelled Appointment</Text>
              <Hr style={divider} />

              <div style={detailRow}>
                <Text style={label}>Date</Text>
                <Text style={value}>{date}</Text>
              </div>

              <div style={detailRow}>
                <Text style={label}>Time</Text>
                <Text style={value}>{time}</Text>
              </div>

              <div style={detailRow}>
                <Text style={label}>Service</Text>
                <Text style={value}>{serviceName}</Text>
              </div>

              {stylistName && (
                <div style={detailRow}>
                  <Text style={label}>Stylist</Text>
                  <Text style={value}>{stylistName}</Text>
                </div>
              )}

              {reason && (
                <>
                  <Hr style={divider} />
                  <div style={reasonSection}>
                    <Text style={reasonLabel}>Reason</Text>
                    <Text style={reasonText}>{reason}</Text>
                  </div>
                </>
              )}
            </Section>

            <Text style={text}>
              We apologize for any inconvenience this may cause. Please feel free to book a new
              appointment at your convenience.
            </Text>

            <Text style={text}>
              If you have any questions or need assistance, please don&apos;t hesitate to contact
              us.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              {businessName}
              <br />
              {businessAddress}
              <br />
              {businessPhone}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f4f4f5',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const headerSection = {
  textAlign: 'center' as const,
  padding: '32px 0 24px',
};

const logo = {
  margin: '0 auto',
  borderRadius: '12px',
};

const subtitle = {
  fontSize: '14px',
  color: '#71717a',
  margin: '12px 0 0',
};

const iconSection = {
  textAlign: 'center' as const,
  padding: '0 0 24px',
};

const cancelIconCircle = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: '#fef2f2',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
};

const cancelIcon = {
  fontSize: '28px',
  color: '#dc2626',
  margin: '0',
  lineHeight: '64px',
};

const contentSection = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '32px',
  margin: '0 20px',
};

const heading = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#18181b',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const greeting = {
  fontSize: '16px',
  color: '#18181b',
  margin: '0 0 16px',
};

const text = {
  fontSize: '14px',
  color: '#52525b',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const detailsCard = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const detailsTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#dc2626',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const divider = {
  borderColor: '#fecaca',
  margin: '12px 0',
};

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
};

const label = {
  fontSize: '14px',
  color: '#71717a',
  margin: '0',
};

const value = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#18181b',
  margin: '0',
};

const reasonSection = {
  padding: '8px 0 0',
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

const footer = {
  textAlign: 'center' as const,
  padding: '32px 20px',
};

const footerText = {
  fontSize: '12px',
  color: '#a1a1aa',
  lineHeight: '20px',
  margin: '0',
};
