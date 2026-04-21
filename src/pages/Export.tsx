import { motion } from 'motion/react';
import { Globe2, ShieldCheck, FileCheck, Ship, CheckCircle, BarChart, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useContent } from '../lib/useContent';

export default function Export() {
  const { content } = useContent();
  return (
    <div>
      {/* Page Header - Home Style */}
      <section className="relative w-full overflow-hidden">
        {/* Background Image */}
        <div className="relative w-full">
          <img
            src={content.exportHeroImage || "https://images.unsplash.com/photo-1494412519320-aa613dfb7738?auto=format&fit=crop&q=80&w=2000"}
            alt="Export"
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
                {(content.exportTitle || "Exporting Excellence Worldwide.").split(' ').map((word, i, arr) => 
                  i === arr.length - 1 ? <span key={i} className="text-[#facc15]">{word}</span> : <span key={i}>{word} </span>
                )}
              </h1>
              <h2 className="text-2xl lg:text-4xl font-sans font-bold text-white mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight text-left">
                {content.exportSubtitle || "Global Presence"}
              </h2>
              
              <p className="text-base lg:text-xl font-sans font-bold text-white mb-6 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-left">
                {content.exportText || "Connecting Indian agricultural heritage to the global animal feed industry with uncompromising standards."}
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

      {/* Global Reach - Split Layout */}
      <section className="section-padding bg-brand-paper">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-brand-gold font-sans font-bold uppercase tracking-[0.2em] text-[10px] mb-6">Global Supply Chain</h2>
              <h3 className="text-4xl font-serif text-brand-ink mb-8">Trusted in <span className="italic">15+ Nations</span>.</h3>
              <p className="text-brand-ink/70 mb-8 leading-relaxed text-lg font-light">
                RCOM OILS AND SOLVEX has established a robust export network that spans across continents. Our products are trusted by cattle feed manufacturers and agricultural distributors in various international markets.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {(content.exportRegions || []).map((region: string, idx: number) => (
                  <div key={idx} className="flex items-center text-brand-ink font-sans text-[11px] font-bold uppercase tracking-widest">
                    <CheckCircle className="w-4 h-4 text-brand-gold mr-3 shrink-0" />
                    {region}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-brand-ink rounded-[60px] rounded-tr-none p-12 lg:p-20 shadow-2xl border border-white/5">
                <Globe2 className="w-full h-auto text-brand-gold/10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Ship className="w-20 h-20 text-brand-gold mx-auto mb-6 opacity-40" />
                    <p className="text-brand-paper font-serif text-2xl">Global Logistics Partner</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quality Assurance - Dark Aesthetic */}
      <section className="section-padding bg-brand-ink text-white">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-brand-gold font-sans font-bold uppercase tracking-[0.2em] text-[10px] mb-6">Quality Assurance</h2>
            <h3 className="text-4xl md:text-5xl font-serif mb-8">Our Commitment to <span className="italic">Perfection</span>.</h3>
            <p className="text-brand-paper/50 font-light">
              Quality is the foundation of our business. We follow a multi-stage quality control process to ensure every shipment meets international standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10">
            {[
              {
                icon: ShieldCheck,
                title: "Raw Material Inspection",
                desc: "Every batch of mustard seeds is tested for oil content and purity before entering the processing plant."
              },
              {
                icon: BarChart,
                title: "In-Process Monitoring",
                desc: "Our automated systems monitor extraction efficiency and product parameters every hour."
              },
              {
                icon: FileCheck,
                title: "Final Product Testing",
                desc: "Finished products undergo rigorous testing in our in-house laboratory and NABL accredited labs."
              }
            ].map((item, idx) => (
              <div key={idx} className="p-12 border-r last:border-r-0 border-white/10 hover:bg-white/5 transition-all duration-500">
                <item.icon className="w-10 h-10 text-brand-gold mb-8" />
                <h4 className="text-xl font-serif mb-4">{item.title}</h4>
                <p className="text-brand-paper/40 text-sm font-light leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Standards - Minimal Grid */}
      <section className="section-padding bg-brand-paper">
        <div className="container-custom">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-serif text-brand-ink">Manufacturing Standards</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(content.exportCerts || []).map((cert: any, idx: number) => (
              <div key={idx} className="bg-white p-10 rounded-3xl text-center group border border-brand-ink/5 hover:border-brand-gold transition-all">
                <div className="w-16 h-16 bg-brand-paper rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-brand-gold/10 transition-all">
                  <ShieldCheck className="w-8 h-8 text-brand-ink/20 group-hover:text-brand-gold" />
                </div>
                <h4 className="font-serif text-xl text-brand-ink mb-2">{cert.title}</h4>
                <p className="text-brand-ink/40 text-[9px] font-sans font-bold uppercase tracking-widest">{cert.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Export Logistics - Elegant Split */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="bg-brand-paper rounded-[80px] rounded-bl-none overflow-hidden shadow-2xl border border-brand-ink/5">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-16 lg:p-24">
                <h3 className="text-3xl font-serif text-brand-ink mb-10">Seamless Export Logistics</h3>
                <ul className="space-y-8">
                  <li className="flex items-start">
                    <div className="bg-brand-gold/10 p-3 rounded-xl mr-6 shrink-0">
                      <Ship className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div>
                      <h4 className="font-serif text-xl text-brand-ink mb-2">Port Proximity</h4>
                      <p className="text-brand-ink/50 text-sm font-light leading-relaxed">Efficient road connectivity to major Indian ports for faster transit times.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-brand-gold/10 p-3 rounded-xl mr-6 shrink-0">
                      <FileCheck className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div>
                      <h4 className="font-serif text-xl text-brand-ink mb-2">Documentation Support</h4>
                      <p className="text-brand-ink/50 text-sm font-light leading-relaxed">Complete handling of Bill of Lading, Certificate of Origin, and Phytosanitary certificates.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-brand-gold/10 p-3 rounded-xl mr-6 shrink-0">
                      <Package className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div>
                      <h4 className="font-serif text-xl text-brand-ink mb-2">Customized Packaging</h4>
                      <p className="text-brand-ink/50 text-sm font-light leading-relaxed">Bulk and containerized packaging options tailored for long-distance sea freight.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-brand-ink p-16 lg:p-24 flex flex-col justify-center text-white relative overflow-hidden">
                <Globe2 className="absolute -bottom-20 -right-20 w-80 h-80 text-white/5" />
                <div className="relative z-10">
                  <h4 className="text-3xl font-serif mb-8 leading-tight">Ready for your next <span className="italic text-brand-gold">shipment</span>?</h4>
                  <p className="text-brand-paper/50 font-light mb-12 text-lg">
                    Our export team is ready to discuss your requirements, shipping schedules, and payment terms.
                  </p>
                  <Link
                    to="/inquiry"
                    className="btn-premium btn-gold w-full"
                  >
                    Request Export Quote
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
