import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import './RootLayout.css'; // ייבוא הסטייל החדש

export default function RootLayout() {
  return (
    <div className="layout-wrapper">
      <Navbar />
      
      <main className="main-content">
        <Outlet />
      </main>
      
      <footer className="main-footer">
        <p className="footer-text">
          &copy; {new Date().getFullYear()} Royal Icing Catalog. All rights reserved.
        </p>
        <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#d4af37' }}>
          אמנות בזילוף בעבודת יד
        </div>
      </footer>
    </div>
  );
}