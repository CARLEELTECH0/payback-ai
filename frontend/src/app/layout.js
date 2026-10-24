import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#003087',
};

export const metadata = {
  title: 'PayBack AI — Autonomous PayPal Dispute Defense & Churn Recovery',
  description: 'Autonomous 60-Second Chargeback Defense & PayPal Pay Later Churn Bailout Engine for global merchants. Official submission for the PayPal AI Hackathon 2026.',
  keywords: 'PayPal, PayBack AI, PayPal AI Hackathon 2026, Dispute Defense, Pay Later, Churn Bailout, Disputes API, Merchant Protection',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
