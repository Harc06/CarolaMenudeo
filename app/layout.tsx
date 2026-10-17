import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Carola Menudeo', description: 'Administración Carola Menudeo' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body>{children}</body></html>; }
