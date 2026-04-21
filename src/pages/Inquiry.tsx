import { motion } from 'motion/react';
import { FileText, Globe, Truck, ShieldCheck, Send, Users, Package, CheckCircle, Phone, Mail } from 'lucide-react';
import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useContent } from '../lib/useContent';

export default function Inquiry() {
  const { content } = useContent();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    country: '',
    product: 'Mustard De-Oiled Cake (DOC)',
    quantity: '',
    message: ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'inquiries'), {
        ...formState,
        status: 'new',
        createdAt: serverTimestamp()
      });
      
      alert('Your inquiry has been submitted successfully. Our export division will contact you with a formal quote.');
      setFormState({
        name: '',
        company: '',
        email: '',
        phone: '',
        country: '',
        product: 'Mustard De-Oiled Cake (DOC)',
        quantity: '',
        message: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'inquiries');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Page Header - Home Style */}
      <section className="relative w-full overflow-hidden">
        {/* Background Image */}
        <div className="relative w-full">
          <img
            src={content.inquiryHeroImage || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=2000"}
            alt="Inquiry"
            className="w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[3/1] object-cover block"
            referrerPolicy="no-referrer"
          />
          {/* Subtle Overlay for readability */}
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-center z-10">
          <div className="container-custom w-full">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl flex flex-col items-start text-left"
            >
              <h1 className="text-2xl lg:text-4xl font-sans font-bold text-white mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight text-left">
                {"Request a Custom Quote.".split(' ').map((word, i, arr) => 
                  i === arr.length - 1 ? <span key={i} className="text-[#facc15]">{word}</span> : <span key={i}>{word} </span>
                )}
              </h1>
              <h2 className="text-2xl lg:text-4xl font-sans font-bold text-white mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight text-left">
                Bulk Orders
              </h2>
              
              <p className="text-base lg:text-xl font-sans font-bold text-white mb-6 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-left">
                For bulk exports and specialized requirements, please provide the details below. Our export desk will contact you within 24 hours.
              </p>

              <Link 
                to="/contact" 
                className="inline-block bg-[#23532a] hover:bg-[#1a3d1f] text-white text-sm lg:text-base font-bold px-6 lg:px-10 py-2.5 lg:py-3.5 rounded-xl shadow-[0_4px_0_rgb(21,47,24)] active:translate-y-[2px] active:shadow-none transition-all self-start"
              >
                Contact Us
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Inquiry Form Section */}
      <section className="section-padding bg-brand-paper">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Form */}
            <div className="lg:col-span-8">
              <div className="bg-white p-12 lg:p-16 rounded-[60px] rounded-tr-none shadow-2xl border border-brand-ink/5">
                <form onSubmit={handleSubmit} className="space-y-10">
                  {/* Personal Info */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold text-brand-gold uppercase tracking-widest flex items-center">
                      <Users className="w-4 h-4 mr-2" /> Contact Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-brand-ink uppercase tracking-widest ml-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={formState.name}
                          onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                          className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all font-light"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-brand-ink uppercase tracking-widest ml-1">Company Name</label>
                        <input
                          type="text"
                          required
                          value={formState.company}
                          onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                          className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all font-light"
                          placeholder="Global Feeds Ltd."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-brand-ink uppercase tracking-widest ml-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={formState.email}
                          onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                          className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all font-light"
                          placeholder="john@company.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-brand-ink uppercase tracking-widest ml-1">Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={formState.phone}
                          onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                          className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all font-light"
                          placeholder="+1 234 567 890"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold text-brand-gold uppercase tracking-widest flex items-center">
                      <Package className="w-4 h-4 mr-2" /> Product Requirements
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-brand-ink uppercase tracking-widest ml-1">Product Interest</label>
                        <select
                          value={formState.product}
                          onChange={(e) => setFormState({ ...formState, product: e.target.value })}
                          className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all font-light appearance-none"
                        >
                          <option>Mustard De-Oiled Cake (DOC)</option>
                          <option>Mustard Oil Cake</option>
                          <option>Mustard Oil</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-brand-ink uppercase tracking-widest ml-1">Estimated Quantity (MT)</label>
                        <input
                          type="text"
                          required
                          value={formState.quantity}
                          onChange={(e) => setFormState({ ...formState, quantity: e.target.value })}
                          className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all font-light"
                          placeholder="e.g. 500 MT"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold text-brand-gold uppercase tracking-widest flex items-center">
                      <Globe className="w-4 h-4 mr-2" /> Shipping & Logistics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-brand-ink uppercase tracking-widest ml-1">Destination Country</label>
                        <input
                          type="text"
                          required
                          value={formState.country}
                          onChange={(e) => setFormState({ ...formState, country: e.target.value })}
                          className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all font-light"
                          placeholder="e.g. Vietnam"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-brand-ink uppercase tracking-widest ml-1">Additional Requirements</label>
                    <textarea
                      rows={4}
                      value={formState.message}
                      onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                      className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all font-light resize-none"
                      placeholder="Special specifications, packaging needs, or payment terms..."
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`btn-premium btn-gold w-full py-5 text-lg flex items-center justify-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Inquiry'} <Send className="ml-3 w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar Info */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-brand-ink text-white p-10 rounded-[40px] rounded-tr-none border border-white/5 shadow-2xl">
                <h3 className="font-serif text-2xl mb-6">Why Partner with <span className="italic text-brand-gold">RCOM</span>?</h3>
                <ul className="space-y-6">
                  {[
                    { title: "Direct Manufacturer", desc: "No middlemen, ensuring competitive pricing." },
                    { title: "Quality Control", desc: "In-house NABL standard laboratory testing." },
                    { title: "Reliable Supply", desc: "Large scale manufacturing capacity." },
                    { title: "Export Expertise", desc: "Handling all global documentation." }
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-brand-gold mr-4 shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                        <p className="text-brand-paper/40 text-xs font-light leading-relaxed">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-10 rounded-[40px] rounded-bl-none border border-brand-ink/5 shadow-xl">
                <h3 className="font-serif text-xl text-brand-ink mb-4">Need Help?</h3>
                <p className="text-brand-ink/50 text-sm font-light mb-8">Our export specialists are available for a direct consultation.</p>
                <div className="space-y-4">
                  <a href="tel:+919876543210" className="flex items-center text-brand-ink hover:text-brand-gold transition-colors font-sans text-[11px] font-bold uppercase tracking-widest">
                    <Phone className="w-4 h-4 mr-3" /> +91 98765 43210
                  </a>
                  <a href="mailto:export@rcomoils.com" className="flex items-center text-brand-ink hover:text-brand-gold transition-colors font-sans text-[11px] font-bold uppercase tracking-widest">
                    <Mail className="w-4 h-4 mr-3" /> export@rcomoils.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
