import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import Header from './components/Header';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import LiveChat from './components/LiveChat';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './lib/AuthContext';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Products from './pages/Products';
import Export from './pages/Export';
import Contact from './pages/Contact';
import Inquiry from './pages/Inquiry';
import AdminPanel from './pages/AdminPanel';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AuthProvider>
          <Router>
            <div className="flex flex-col min-h-screen">
              <ScrollToTop />
              <Header />
              <main className="flex-grow pt-[72px] md:pt-[104px]">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/export" element={<Export />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/inquiry" element={<Inquiry />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
              <WhatsAppButton />
              <LiveChat />
            </div>
          </Router>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}
