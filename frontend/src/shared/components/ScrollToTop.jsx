// src/shared/components/ScrollToTop.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Función para hacer scroll al inicio en diferentes contenedores
    const scrollToTop = () => {
      // 1. Scroll en window (para StoreLayout, Auth pages, etc.)
      window.scrollTo(0, 0);

      // 2. Scroll en contenedor admin (AdminLayout usa .admin-content con overflow-y: auto)
      const adminContent = document.querySelector('.admin-content');
      if (adminContent) {
        adminContent.scrollTop = 0;
      }

      // 3. Scroll en cualquier otro contenedor con overflow auto/scroll que sea hijo directo de body
      document.querySelectorAll('[style*="overflow"], .MuiDrawer-paper').forEach(el => {
        if (el.scrollHeight > el.clientHeight && (el.style.overflow === 'auto' || el.style.overflow === 'scroll' || el.style.overflowY === 'auto' || el.style.overflowY === 'scroll')) {
          el.scrollTop = 0;
        }
      });
    };

    if (hash) {
      // Si hay hash (anchor), hacer scroll al elemento después de un tick
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          scrollToTop();
        }
      }, 0);
    } else {
      // Scroll al inicio de la página
      scrollToTop();
    }
  }, [pathname, hash]);

  return null;
}