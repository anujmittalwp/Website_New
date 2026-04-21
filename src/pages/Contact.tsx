import { motion } from 'motion/react';
import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from 'lucide-react';
import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useContent } from '../lib/useContent';

export default function Contact() {
  const { content } = useContent();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'contactMessages'), {
        ...formState,
        createdAt: serverTimestamp()
      });
      
      alert('Thank you for your message. Our team will get back to you shortly.');
      setFormState({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'contactMessages');
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
            src={content.contactHeroImage || "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?auto=format&fit=crop&q=80&w=2000"}
            alt="Contact"
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
                {"Connect with our Global Team.".split(' ').map((word, i, arr) => 
                  i === arr.length - 1 ? <span key={i} className="text-[#facc15]">{word}</span> : <span key={i}>{word} </span>
                )}
              </h1>
              <h2 className="text-2xl lg:text-4xl font-sans font-bold text-white mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight text-left">
                Get In Touch
              </h2>
              
              <p className="text-base lg:text-xl font-sans font-bold text-white mb-6 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-left">
                Whether you are an international buyer or a local distributor, we are here to assist with your requirements.
              </p>

              <Link 
                to="/inquiry" 
                className="inline-block bg-[#23532a] hover:bg-[#1a3d1f] text-white text-sm lg:text-base font-bold px-6 lg:px-10 py-2.5 lg:py-3.5 rounded-xl shadow-[0_4px_0_rgb(21,47,24)] active:translate-y-[2px] active:shadow-none transition-all self-start"
              >
                Get A Quote
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section - Split Layout */}
      <section className="section-padding bg-brand-paper">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
            {/* Contact Info */}
            <div>
              <h2 className="text-brand-gold font-sans font-bold uppercase tracking-[0.2em] text-[10px] mb-6">Contact Information</h2>
              <h3 className="text-4xl font-serif text-brand-ink mb-12">Our <span className="italic">Headquarters</span>.</h3>

              <div className="space-y-12">
                <div className="flex items-start">
                  <div className="bg-white p-4 rounded-2xl shadow-sm mr-6 border border-brand-ink/5">
                    <MapPin className="w-6 h-6 text-brand-gold" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xl text-brand-ink mb-2">Registered Office</h4>
                    <p className="text-brand-ink/50 font-light leading-relaxed">
                      RCOM OILS AND SOLVEX PRIVATE LIMITED<br />
                      Khasra No. 23, 24, 32 & 33, NH709,<br />
                      Bhiwani - Loharu Road, Village Lohani,<br />
                      Malwas Devsar, Haryana - 127029, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-white p-4 rounded-2xl shadow-sm mr-6 border border-brand-ink/5">
                    <Phone className="w-6 h-6 text-brand-gold" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xl text-brand-ink mb-2">Phone & WhatsApp</h4>
                    <p className="text-brand-ink/50 font-light leading-relaxed">
                      General Inquiries: +91 7503001001<br />
                      Export Desk: +91 9313501001
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-white p-4 rounded-2xl shadow-sm mr-6 border border-brand-ink/5">
                    <Mail className="w-6 h-6 text-brand-gold" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xl text-brand-ink mb-2">Email Address</h4>
                    <p className="text-brand-ink/50 font-light leading-relaxed">
                      Sales: sales@rcomoils.com<br />
                      Exports: export@rcomoils.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-white p-4 rounded-2xl shadow-sm mr-6 border border-brand-ink/5">
                    <Clock className="w-6 h-6 text-brand-gold" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xl text-brand-ink mb-2">Business Hours</h4>
                    <p className="text-brand-ink/50 font-light leading-relaxed">
                      Monday - Saturday: 09:00 AM - 06:00 PM (IST)<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-16 bg-brand-ink text-white p-10 rounded-[40px] rounded-bl-none border border-white/5">
                <h3 className="font-serif text-2xl mb-4 flex items-center">
                  <MessageCircle className="w-6 h-6 mr-3 text-brand-gold" /> Quick Support
                </h3>
                <p className="text-brand-paper/50 font-light mb-8 text-sm">
                  Need an immediate response? Chat with our export manager on WhatsApp.
                </p>
                <a
                  href="https://wa.me/917503001001"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-premium btn-gold w-full text-center"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white p-12 lg:p-16 rounded-[60px] rounded-tr-none shadow-2xl border border-brand-ink/5">
              <h3 className="text-3xl font-serif text-brand-ink mb-8">Send a <span className="italic">Message</span></h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-brand-ink uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all font-light"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-brand-ink uppercase tracking-widest ml-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all font-light"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-brand-ink uppercase tracking-widest ml-1">Subject</label>
                  <input
                    type="text"
                    value={formState.subject}
                    onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                    placeholder="Export Inquiry"
                    className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all font-light"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-brand-ink uppercase tracking-widest ml-1">Message</label>
                  <textarea
                    rows={5}
                    required
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    placeholder="How can we help you?"
                    className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all font-light resize-none"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`btn-premium btn-gold w-full py-5 text-lg flex items-center justify-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'} <Send className="ml-3 w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section - Full Width */}
      <section className="h-[500px] w-full bg-brand-paper relative transition-all duration-1000">
        <iframe
          src="https://maps.google.com/maps?q=RCOM+OILS+AND+SOLVEX+PRIVATE+LIMITED&t=&z=15&ie=UTF8&iwloc=&output=embed"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Office Location"
        ></iframe>
      </section>
    </div>
  );
}
