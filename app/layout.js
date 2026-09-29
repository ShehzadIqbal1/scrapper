import './globals.css';

export const metadata = {
  title: 'Maps Leads Dashboard',
  description: 'Places scraped from Google Maps, stored in MongoDB'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
