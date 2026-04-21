import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Twitter, Linkedin, ArrowRight } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div className="space-y-6">
            <div>
              <span className="text-white font-bold text-2xl">RCOM OILS</span>
              <p className="text-xs font-semibold tracking-widest uppercase text-brand-yellow mt-1">AND SOLVEX PRIVATE LIMITED</p>
            </div>
            <p className="text-sm leading-relaxed">
              Leading manufacturer and global exporter of premium mustard products. Specializing in high-protein Mustard De-Oiled Cake and pure Mustard Oil.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-brand-yellow transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-brand-yellow transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-brand-yellow transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-4 text-sm">
              <li><Link to="/" className="hover:text-brand-yellow transition-colors flex items-center"><ArrowRight className="w-3 h-3 mr-2" /> Home</Link></li>
              <li><Link to="/about" className="hover:text-brand-yellow transition-colors flex items-center"><ArrowRight className="w-3 h-3 mr-2" /> About Us</Link></li>
              <li><Link to="/products" className="hover:text-brand-yellow transition-colors flex items-center"><ArrowRight className="w-3 h-3 mr-2" /> Our Products</Link></li>
              <li><Link to="/export" className="hover:text-brand-yellow transition-colors flex items-center"><ArrowRight className="w-3 h-3 mr-2" /> Export & Quality</Link></li>
              <li><Link to="/contact" className="hover:text-brand-yellow transition-colors flex items-center"><ArrowRight className="w-3 h-3 mr-2" /> Contact Us</Link></li>
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Our Products</h3>
            <ul className="space-y-4 text-sm">
              <li><Link to="/products" className="hover:text-brand-yellow transition-colors">Mustard Oil</Link></li>
              <li><Link to="/products" className="hover:text-brand-yellow transition-colors">Mustard Oil Cake</Link></li>
              <li><Link to="/products" className="hover:text-brand-yellow transition-colors">Mustard De-Oiled Cake (DOC)</Link></li>
              <li><Link to="/products" className="hover:text-brand-yellow transition-colors">Solvent Extracted Products</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Contact Us</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 text-brand-yellow shrink-0" />
                <span>Khasra No. 23, 24, 32 & 33, NH709, Village Lohani, Haryana - 127029, India</span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 mr-3 text-brand-yellow shrink-0" />
                <span>+91 7503001001</span>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-brand-yellow shrink-0" />
                <span>info@rcomoils.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:row justify-between items-center text-xs text-slate-500">
          <p>© {currentYear} RCOM OILS AND SOLVEX PRIVATE LIMITED. All Rights Reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/admin" className="hover:text-slate-300">Admin Login</Link>
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
