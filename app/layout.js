import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'LeadPulse | Google Maps Leads Dashboard',
  description: 'Real-time Google Maps business lead extraction, MongoDB intelligence & CRM export'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="font-sans bg-[#070a12] text-[#f1f5f9] antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
