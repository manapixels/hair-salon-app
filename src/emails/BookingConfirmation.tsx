import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
  render,
} from '@react-email/components';
import React from 'react';

interface BookingConfirmationProps {
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  duration: string;
  stylistName: string;
  stylistAvatarUrl?: string; // New: Stylist Avatar
  appointmentId: string;
  rescheduleUrl: string;
  cancelUrl: string;
  baseUrl?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
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
  color: '#059669',
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

const card = {
  backgroundColor: '#faf9f5',
  borderRadius: '12px',
  border: '1px solid #e8e4d9',
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

const buttonSecondary = {
  display: 'inline-block',
  backgroundColor: '#ffffff',
  color: '#7A6400',
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

// Added missing styles
const subtitle = {
  margin: '0',
  color: '#718096',
  fontSize: '16px',
  lineHeight: '1.5',
};

const contactText = {
  fontSize: '14px',
  color: '#a0aec0',
  textAlign: 'center' as const,
  marginTop: '32px',
};

export const BookingConfirmationEmail = ({
  customerName = 'Guest',
  serviceName = 'Haircut',
  date = 'Monday, Jan 1',
  time = '10:00 AM',
  duration = '60min',
  stylistName = 'Any Available',
  stylistAvatarUrl,
  rescheduleUrl = '#',
  cancelUrl = '#',
  baseUrl = 'https://signaturetrims.com', // Default fallback
  businessName = 'Signature Trims',
  businessAddress = '930 Yishun Avenue 1 #01-127, Singapore 760930',
  businessPhone = '+65 8022 2338',
}: BookingConfirmationProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Booking Confirmed: {serviceName} on {date}
      </Preview>
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
            <Heading style={headerTitle}>Thanks for your booking!</Heading>
            <Text style={subtitle}>You&apos;re all set! Below are your appointment details.</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            {/* Appointment Card */}
            <Section style={card}>
              <Section
                style={{
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e8e4d9',
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

              <Row
                style={{
                  paddingTop: '12px',
                  marginTop: '4px',
                  borderTop: '1px solid #e8e4d9',
                }}
              >
                <Column style={{ width: '100px' }}>
                  <Text style={label}>Stylist</Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                  {stylistAvatarUrl && (
                    <Img
                      src={stylistAvatarUrl}
                      alt={stylistName}
                      width="24"
                      height="24"
                      style={{
                        borderRadius: '50%',
                        marginRight: '8px',
                        display: 'inline-block',
                        verticalAlign: 'middle',
                      }}
                    />
                  )}
                  <Text style={{ ...value, display: 'inline', verticalAlign: 'middle' }}>
                    {stylistName}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Actions */}
            <Section style={{ marginTop: '32px' }}>
              <Row>
                <Column style={{ width: '50%', paddingRight: '6px' }}>
                  <Button
                    href={cancelUrl}
                    style={{
                      ...buttonSecondary,
                      display: 'block',
                      width: '100%',
                      textAlign: 'center',
                      padding: '12px 0',
                      backgroundColor: '#e8e4d9',
                      border: 'none',
                    }}
                  >
                    Cancel
                  </Button>
                </Column>
                <Column style={{ width: '50%', paddingLeft: '6px' }}>
                  <Button
                    href={rescheduleUrl}
                    style={{
                      ...buttonSecondary,
                      display: 'block',
                      width: '100%',
                      textAlign: 'center',
                      padding: '12px 0',
                      border: '1px solid #7A6400',
                      color: '#7A6400',
                    }}
                  >
                    Reschedule
                  </Button>
                </Column>
              </Row>
            </Section>

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
};

export default BookingConfirmationEmail;
