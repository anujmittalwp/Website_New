import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, Mail, Globe } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../lib/AuthContext';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'About Us', href: '/about' },
  { name: 'Products', href: '/products' },
  { name: 'Export & Quality', href: '/export' },
  { name: 'Contact', href: '/contact' },
];

export default function Header() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn(
      "fixed w-full z-50 transition-all duration-500 border-b",
      scrolled ? "bg-brand-paper/95 backdrop-blur-md py-3 border-brand-ink/10" : "bg-transparent py-6 border-transparent"
    )}>
      <div className="container-custom flex justify-between items-center">
        <Link to="/" className="flex items-center group">
          <img 
            src="https://res.cloudinary.com/dwgjahd8f/image/upload/v1775714275/Logo_k8limi.png" 
            alt="RCOM OILS" 
            className="h-14 md:h-20 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-10">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "text-[11px] font-sans font-bold uppercase tracking-widest transition-all hover:text-brand-gold",
                location.pathname === item.href ? "text-brand-gold" : "text-brand-ink/70"
              )}
            >
              {item.name}
            </Link>
          ))}
          {user?.email && ['rcomoilsandsolvex@gmail.com', 'anujkumarmittal@gmail.com'].includes(user.email) && (
            <Link
              to="/admin"
              className={cn(
                "text-[11px] font-sans font-bold uppercase tracking-widest transition-all hover:text-brand-gold",
                location.pathname === '/admin' ? "text-brand-gold" : "text-brand-ink/70"
              )}
            >
              Admin
            </Link>
          )}
          <Link
            to="/inquiry"
            className="btn-premium btn-gold !px-6 !py-2.5"
          >
            Inquiry
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-brand-ink p-2"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-brand-paper border-t border-brand-ink/5 absolute w-full left-0 shadow-2xl h-screen">
          <div className="px-6 pt-12 pb-6 space-y-6 flex flex-col items-center">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "text-2xl font-serif font-medium",
                  location.pathname === item.href ? "text-brand-gold" : "text-brand-ink"
                )}
              >
                {item.name}
              </Link>
            ))}
            {user?.email && ['rcomoilsandsolvex@gmail.com', 'anujkumarmittal@gmail.com'].includes(user.email) && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "text-2xl font-serif font-medium",
                  location.pathname === '/admin' ? "text-brand-gold" : "text-brand-ink"
                )}
              >
                Admin
              </Link>
            )}
            <Link
              to="/inquiry"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-premium btn-gold w-full mt-8"
            >
              Get Quote
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
