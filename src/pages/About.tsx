import { motion } from 'motion/react';
import { Target, Eye, Award, Settings, Users, Factory } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useContent } from '../lib/useContent';

export default function About() {
  const { content } = useContent();
  return (
    <div>
      {/* Page Header - Home Style */}
      <section className="relative w-full overflow-hidden">
        {/* Background Image */}
        <div className="relative w-full">
          <img
            src={content.aboutHeroImage || "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&q=80&w=2000"}
            alt="About Us"
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
                {content.aboutHeroTitle.split(' ').map((word, i, arr) => 
                  i === arr.length - 1 ? <span key={i} className="text-[#facc15]">{word}</span> : <span key={i}>{word} </span>
                )}
              </h1>
              <h2 className="text-2xl lg:text-4xl font-sans font-bold text-white mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight text-left">
                {content.aboutHeroSubtitle}
              </h2>
              
              <p className="text-base lg:text-xl font-sans font-bold text-white mb-6 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-left">
                {content.aboutHeroText}
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

      {/* Overview - Split Layout */}
      <section className="section-padding bg-brand-paper">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden rounded-[100px] rounded-tr-none shadow-2xl bg-brand-ink/5">
                <img
                  src={content.aboutImage || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200"}
                  alt="Factory Interior"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-10 -right-10 hidden md:block">
                <div className="bg-brand-ink p-12 rounded-3xl shadow-2xl border border-white/10">
                  <p className="text-brand-gold font-serif text-4xl font-bold">ISO</p>
                  <p className="text-brand-paper/60 font-sans text-[9px] font-bold uppercase tracking-widest mt-2">9001:2015 Certified</p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-brand-gold font-sans font-bold uppercase tracking-[0.2em] text-[10px] mb-6">Who We Are</h2>
              <h3 className="text-4xl font-serif text-brand-ink mb-8">Crafting Excellence in <span className="italic">Haryana</span>.</h3>
              <div className="space-y-6 text-brand-ink/70 font-light leading-relaxed text-lg">
                <p>
                  Established with a vision to revolutionize the agricultural processing sector, RCOM OILS AND SOLVEX has grown into a leading manufacturer and exporter of mustard-based products.
                </p>
                <p>
                  Our state-of-the-art facility in Haryana, India, is equipped with the latest solvent extraction technology, allowing us to produce high-protein Mustard De-Oiled Cake (DOC) that meets the most stringent international standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision - Elegant Cards */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-brand-paper p-16 rounded-[60px] rounded-bl-none border border-brand-ink/5"
            >
              <div className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mb-10">
                <Target className="w-8 h-8 text-brand-gold" />
              </div>
              <h3 className="text-3xl font-serif text-brand-ink mb-6">Our Mission</h3>
              <p className="text-brand-ink/60 font-light leading-relaxed text-lg">
                To provide the global animal feed and food industries with premium, nutrient-rich mustard products through sustainable manufacturing practices and innovative extraction technologies.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -10 }}
              className="bg-brand-ink text-white p-16 rounded-[60px] rounded-tr-none border border-white/5"
            >
              <div className="w-16 h-16 bg-brand-gold/20 rounded-full flex items-center justify-center mb-10">
                <Eye className="w-8 h-8 text-brand-gold" />
              </div>
              <h3 className="text-3xl font-serif mb-6">Our Vision</h3>
              <p className="text-brand-paper/50 font-light leading-relaxed text-lg">
                To be the world's most trusted and efficient manufacturer of mustard products, recognized for our commitment to quality, transparency, and global export excellence.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Expertise - Minimal Grid */}
      <section className="section-padding bg-brand-paper">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-brand-gold font-sans font-bold uppercase tracking-[0.2em] text-[10px] mb-6">Our Expertise</h2>
            <h3 className="text-4xl font-serif text-brand-ink">Precision Engineering in <span className="italic">Agriculture</span>.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-brand-ink/10">
            {[
              {
                icon: Settings,
                title: "Precision Processing",
                desc: "Automated systems monitor every parameter to ensure consistent quality across every batch."
              },
              {
                icon: Users,
                title: "Expert Team",
                desc: "Managed by industry veterans who bring decades of experience in oilseed processing."
              },
              {
                icon: Factory,
                title: "Modern Infrastructure",
                desc: "Continuous investment in machinery to maintain high efficiency and global standards."
              }
            ].map((item, idx) => (
              <div key={idx} className="p-12 border-r last:border-r-0 border-brand-ink/10 text-center group hover:bg-white transition-colors duration-500">
                <div className="inline-flex p-5 bg-brand-gold/10 rounded-2xl mb-8 group-hover:bg-brand-gold group-hover:text-white transition-all">
                  <item.icon className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-serif text-brand-ink mb-4">{item.title}</h4>
                <p className="text-brand-ink/50 text-sm font-light leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
