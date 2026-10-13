// src/shared/components/ScrollToTopWrapper.jsx
import { Outlet } from 'react-router-dom';
import ScrollToTop from './ScrollToTop';

export default function ScrollToTopWrapper() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}