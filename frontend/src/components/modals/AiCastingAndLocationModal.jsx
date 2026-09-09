import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { aiApi } from '../../api/aiApi';
import { scriptApi } from '../../api/scriptApi';
import {
  X,
  Users,
  MapPin,
  Sparkles,
  ExternalLink,
  Award,
  Film,
  CheckCircle2,
  Send,
  RefreshCw,
  Sun,
  ShieldCheck,
  DollarSign,
  Clapperboard,
  Calendar,
  CloudSun,
  Filter,
  Check,
  TrendingUp,
  Layers
} from 'lucide-react';

export const AiCastingAndLocationModal = ({
  isOpen,
  onClose,
  initialTab = 'casting',
  movieId,
  movieTitle,
  scenes = [],
  role = 'DIRECTOR',
  preselectedSceneNumber = null,
  onDispatchCasting,
  onApplyLocationSuccess,
  onCreateScheduleAtLocation
}) => {
  const { showToast } = useNotifications();

  const [activeSubTab, setActiveSubTab] = useState(initialTab); // 'casting' | 'locations'
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [selectedSceneFilter, setSelectedSceneFilter] = useState(preselectedSceneNumber ? String(preselectedSceneNumber) : 'ALL');
  const [applyingSceneId, setApplyingSceneId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setActiveSubTab(initialTab);
      if (preselectedSceneNumber) {
        setSelectedSceneFilter(String(preselectedSceneNumber));
      } else {
        setSelectedSceneFilter('ALL');
      }
      fetchLiveAiSuggestions();
    }
  }, [isOpen, movieId, initialTab, preselectedSceneNumber]);

  const fetchLiveAiSuggestions = async () => {
    if (!movieId) return;
    setLoading(true);
    try {
      let res;
      if (role === 'PRODUCER' && activeSubTab === 'locations') {
        res = await aiApi.runProducerAi(
          movieId,
          "Analyze script scenes and provide detailed location feasibility, rental rates, union clearances, and scene groupings.",
          true,
          'LOCATION_SUGGESTION'
        );
      } else {
        res = await aiApi.runDirectorAi(
          movieId,
          "Analyze screenplay content and generate real-time casting suggestions for Hero, Heroine, and Villain roles, plus recommended shooting locations mapped to scenes.",
          null,
          null,
          activeSubTab === 'locations' ? 'LOCATION_SUGGESTION' : 'CASTING_ADVICE'
        );
      }
      setAiData(res);
      showToast("✨ Real-Time AI Casting & Scene Location Suggestions generated!", "info");
    } catch (err) {
      showToast(`AI suggestion error: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLocationToScene = async (targetScene, locName) => {
    if (!targetScene?.id) return;
    setApplyingSceneId(targetScene.id);
    try {
      await scriptApi.updateScene(targetScene.id, { location: locName });
      showToast(`📍 Scene #${targetScene.sceneNumber} location updated to "${locName}"!`, "success");
      if (onApplyLocationSuccess) {
        onApplyLocationSuccess(targetScene.id, locName);
      }
    } catch (err) {
      alert(`Failed to update scene location: ${err.message}`);
    } finally {
      setApplyingSceneId(null);
    }
  };

  const handleApplyLocationToAllMatchedScenes = async (matchedNums, locName) => {
    if (!matchedNums || matchedNums.length === 0 || !scenes || scenes.length === 0) return;
    const targetScenes = scenes.filter(s => matchedNums.includes(s.sceneNumber));
    if (targetScenes.length === 0) return;

    setApplyingSceneId('ALL');
    try {
      await Promise.all(
        targetScenes.map(sc => scriptApi.updateScene(sc.id, { location: locName }))
      );
      showToast(`📍 Updated location to "${locName}" across ${targetScenes.length} scene(s)!`, "success");
      if (onApplyLocationSuccess) {
        onApplyLocationSuccess(null, locName);
      }
    } catch (err) {
      alert(`Failed to batch update scenes: ${err.message}`);
    } finally {
      setApplyingSceneId(null);
    }
  };

  if (!isOpen) return null;

  const structured = aiData?.structuredInsights || {};
  const castingSuggestions = structured.castingSuggestions || structured.principalCastingBlueprint || [];
  const locationSuggestions = structured.locationSuggestions || structured.locationTopographyStrategy || [];

  const filteredLocationSuggestions = locationSuggestions.filter(loc => {
    if (selectedSceneFilter === 'ALL') return true;
    const sNum = parseInt(selectedSceneFilter, 10);
    return loc.matchedSceneNumbers && loc.matchedSceneNumbers.includes(sNum);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="cinema-glass rounded-3xl border border-amber-500/30 max-w-5xl w-full p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
                <span>AI Scene Location Scout & Intelligence</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {role} MODE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Project: <strong className="text-amber-400">{movieTitle || 'Active Production'}</strong> • Powered by Gemini 3.6 & Live Telemetry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tab Switcher & Re-run Trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setActiveSubTab('locations')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'locations'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Scene Location Places ({locationSuggestions.length})</span>
            </button>

            {role !== 'PRODUCER' && (
              <button
                onClick={() => setActiveSubTab('casting')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'casting'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Actor & Actress Casting</span>
              </button>
            )}
          </div>

          {/* Scene Filter for Locations */}
          {activeSubTab === 'locations' && scenes.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSceneFilter}
                onChange={(e) => setSelectedSceneFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold focus:border-cyan-400 focus:outline-none"
              >
                <option value="ALL">All Screenplay Scenes ({scenes.length})</option>
                {scenes.map(s => (
                  <option key={s.id || s.sceneNumber} value={s.sceneNumber}>
                    Scene #{s.sceneNumber}: {s.heading ? s.heading.slice(0, 32) : `Scene ${s.sceneNumber}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={fetchLiveAiSuggestions}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500/40 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing Scenes...' : 'Re-Run AI Scout'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-6 pr-1">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-cyan-400 mx-auto animate-bounce" />
              <h4 className="text-sm font-bold text-slate-200">Analyzing Screenplay & Location Suitability...</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Evaluating scene sluglines, natural lighting angles, permit requirements, and live Wikipedia place imagery.
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: LOCATION SUGGESTIONS */}
              {activeSubTab === 'locations' && (
                <div className="space-y-6">
                  {filteredLocationSuggestions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs bg-slate-950/40 rounded-2xl border border-slate-800 p-6">
                      <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="font-semibold text-slate-300">No shooting locations found for this filter.</p>
                      <p className="text-[11px] text-slate-500 mt-1">Select "All Screenplay Scenes" or click 'Re-Run AI Scout'.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredLocationSuggestions.map((loc, lIdx) => {
                        const matchedNums = loc.matchedSceneNumbers || [];
                        const matchedSceneObjects = scenes.filter(s => matchedNums.includes(s.sceneNumber));

                        return (
                          <div
                            key={lIdx}
                            className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg relative overflow-hidden"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                                  loc.settingType === 'EXT'
                                    ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                                    : 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                                }`}>
                                  {loc.settingType || 'EXT / INT'}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  {loc.weatherRiskLevel && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                      loc.weatherRiskLevel === 'HIGH' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                    }`}>
                                      Weather: {loc.weatherRiskLevel}
                                    </span>
                                  )}
                                  {loc.suitabilityRating && (
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                      {loc.suitabilityRating}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
                                  {loc.locationName}
                                </h3>
                                <p className="text-xs text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                                  <span>{loc.suggestedPlace}</span>
                                </p>
                              </div>

                              {loc.imageUrl && (
                                <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative">
                                  <img
                                    src={loc.imageUrl}
                                    alt={loc.suggestedPlace}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                                    <span className="text-[10px] text-slate-300 font-semibold truncate">
                                      Live Wikipedia Reference Image
                                    </span>
                                  </div>
                                </div>
                              )}

                              {loc.description && (
                                <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                  "{loc.description}"
                                </p>
                              )}

                              <div className="space-y-2 text-[11px] text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                                {loc.lightingAdvice && (
                                  <div className="flex items-start gap-2">
                                    <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                    <span><strong className="text-slate-200">Lighting:</strong> {loc.lightingAdvice}</span>
                                  </div>
                                )}

                                {loc.permitRequirements && (
                                  <div className="flex items-start gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                    <span><strong className="text-slate-200">Permits:</strong> {loc.permitRequirements}</span>
                                  </div>
                                )}

                                {loc.estimatedRentalRate && (
                                  <div className="flex items-start gap-2">
                                    <DollarSign className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                    <span><strong className="text-slate-200">Rental Rate:</strong> {loc.estimatedRentalRate}</span>
                                  </div>
                                )}

                                {loc.logisticsNotes && (
                                  <div className="flex items-start gap-2 text-amber-300/90 font-medium">
                                    <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                    <span>{loc.logisticsNotes}</span>
                                  </div>
                                )}

                                {matchedNums.length > 0 && (
                                  <div className="pt-2 border-t border-slate-800/80">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                                      <Film className="w-3 h-3 text-cyan-400" />
                                      Matched Screenplay Scenes:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {matchedNums.map((n, i) => {
                                        const matchSc = scenes.find(s => s.sceneNumber === n);
                                        return (
                                          <div
                                            key={i}
                                            className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-200 flex items-center gap-1.5"
                                          >
                                            <span className="text-amber-400 font-bold font-mono">#{n}</span>
                                            <span className="truncate max-w-[120px]">{matchSc ? matchSc.heading : `Scene ${n}`}</span>
                                            {matchSc && (
                                              <button
                                                onClick={() => handleApplyLocationToScene(matchSc, loc.suggestedPlace || loc.locationName)}
                                                disabled={applyingSceneId === matchSc.id}
                                                className="ml-1 text-[9px] font-bold text-cyan-400 hover:text-white bg-cyan-500/20 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                                title={`Apply ${loc.suggestedPlace} to Scene #${n}`}
                                              >
                                                {applyingSceneId === matchSc.id ? 'Applying...' : 'Apply'}
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                              {loc.wikiUrl ? (
                                <a
                                  href={loc.wikiUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                                >
                                  <ExternalLink className="w-3 h-3" /> Live Wiki Data
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono">Verified Location Place</span>
                              )}

                              <div className="flex items-center gap-2">
                                {matchedSceneObjects.length > 0 && (
                                  <button
                                    onClick={() => handleApplyLocationToAllMatchedScenes(matchedNums, loc.suggestedPlace || loc.locationName)}
                                    disabled={applyingSceneId === 'ALL'}
                                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{applyingSceneId === 'ALL' ? 'Applying...' : `Apply to All (${matchedSceneObjects.length} Scenes)`}</span>
                                  </button>
                                )}

                                {role === 'PRODUCER' && onCreateScheduleAtLocation && (
                                  <button
                                    onClick={() => {
                                      onClose();
                                      onCreateScheduleAtLocation(loc);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                  >
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Schedule Shoot</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CASTING SUGGESTIONS */}
              {activeSubTab === 'casting' && (
                <div className="space-y-6">
                  {castingSuggestions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No casting suggestions returned yet. Click 'Re-Run AI Scout' above.
                    </div>
                  ) : (
                    castingSuggestions.map((group, gIdx) => {
                      const roleName = group.roleArchetype || group.characterName || `Role #${gIdx + 1}`;
                      const actorList = group.suggestedActors || group.actors || [];
                      return (
                        <div
                          key={gIdx}
                          className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-4"
                        >
                          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                                {roleName}
                              </span>
                              <h3 className="text-sm font-bold text-slate-100 font-['Outfit'] mt-1">
                                {group.characterName || roleName}
                              </h3>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {group.requiredTraits || group.function || 'Performance requirements for lead dramatic presence.'}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {actorList.map((actor, aIdx) => (
                              <div
                                key={aIdx}
                                className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/90 flex flex-col justify-between space-y-3"
                              >
                                <div className="flex items-start gap-3">
                                  {actor.imageUrl ? (
                                    <img
                                      src={actor.imageUrl}
                                      alt={actor.actorName}
                                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 font-bold">
                                      {actor.actorName?.slice(0, 2) || 'AC'}
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <h4 className="text-xs font-bold text-slate-100 truncate">
                                        {actor.actorName}
                                      </h4>
                                      {actor.suitabilityScore && (
                                        <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                                          {actor.suitabilityScore}% Match
                                        </span>
                                      )}
                                    </div>

                                    {actor.pastWork && (
                                      <p className="text-[11px] text-amber-400 font-medium truncate mt-0.5">
                                        Notable: {actor.pastWork}
                                      </p>
                                    )}

                                    {actor.rationale && (
                                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                                        {actor.rationale}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                  {actor.wikiUrl ? (
                                    <a
                                      href={actor.wikiUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                                    >
                                      <ExternalLink className="w-3 h-3" /> Wiki Profile
                                    </a>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-mono">Actor Profile</span>
                                  )}

                                  <button
                                    onClick={() => {
                                      onClose();
                                      if (onDispatchCasting) {
                                        onDispatchCasting(actor, role);
                                      }
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 border border-amber-500/30"
                                  >
                                    <Send className="w-3 h-3" /> Dispatch Offer
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
