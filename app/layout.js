export const metadata = {
  title: 'AI RSS Trends',
  description: 'Aggregate key AI RSS feeds including ChatGPT and Claude updates.'
};

import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
