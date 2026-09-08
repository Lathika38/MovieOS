import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Clapperboard, Layers, Zap, Users } from 'lucide-react';

export const HeroSection = () => {
  const scrollToAiAgents = () => {
    const el = document.getElementById('ai-agents');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const featurePills = [
    { icon: Clapperboard, title: 'AI Script Breakdown', desc: 'Auto scene & character extraction' },
    { icon: Layers, title: 'Multi-Agent Synthesis', desc: 'Autonomous cross-department sync' },
    { icon: Zap, title: 'Real-Time Logistics', desc: 'Dynamic scheduling & risk mitigation' },
    { icon: Users, title: 'Role-Based Workspaces', desc: 'Director, Producer, Actor & Music' }
  ];

  return (
    <section className="relative pt-32 sm:pt-40 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center z-10 overflow-hidden">
      {/* Top Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold tracking-wider mb-8 shadow-xl shadow-amber-500/5 backdrop-blur-md">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>CINEMA OPERATING SYSTEM • MULTI-AGENT AI</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-['Cinzel'] tracking-wide leading-tight text-slate-100 max-w-5xl mx-auto">
        The AI Operating System for <br className="hidden sm:inline" />
        <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-cyan-400 bg-clip-text text-transparent">
          Modern Film Production
        </span>
      </h1>

      {/* Secondary Subheadline */}
      <h2 className="text-base sm:text-xl font-bold font-['Outfit'] tracking-widest uppercase text-slate-400 mt-4">
        Plan • Coordinate • Adapt • Create
      </h2>

      {/* Description */}
      <p className="text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto mt-6 leading-relaxed">
        MovieOS unifies specialized AI agents to analyze scripts, coordinate multi-department logistics, resolve production bottlenecks, and empower filmmaking teams from pre-production to wrap.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
        <Link
          to="/login"
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 hover:scale-105 cursor-pointer"
        >
          <span>Launch Production Studio</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <button
          onClick={scrollToAiAgents}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-amber-500/40 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Explore AI Agents</span>
        </button>
      </div>

      {/* Modern Studio Intelligence Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16 max-w-6xl mx-auto text-left">
        {featurePills.map((pill, idx) => {
          const Icon = pill.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/30 transition-all backdrop-blur-sm group hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:bg-amber-500/20 transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 font-['Outfit']">{pill.title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-normal">{pill.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
