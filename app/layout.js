import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'LeadPulse | Google Maps Leads Dashboard',
  description: 'Real-time Google Maps business lead extraction, MongoDB intelligence & CRM export'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
