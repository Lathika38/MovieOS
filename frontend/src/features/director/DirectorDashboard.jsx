import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMovie } from '../../context/MovieContext';
import { useNotifications } from '../../context/NotificationContext';
import { scriptApi } from '../../api/scriptApi';
import { castingApi } from '../../api/castingApi';
import { musicApi } from '../../api/musicApi';
import { authApi } from '../../api/authApi';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { CastingRequestModal } from '../../components/modals/CastingRequestModal';
import { EditSceneModal } from '../../components/modals/EditSceneModal';
import { TalentProfileModal } from '../../components/modals/TalentProfileModal';
import { EditMovieModal } from '../../components/modals/EditMovieModal';
import { CreateAnnouncementModal } from '../../components/modals/CreateAnnouncementModal';
import { AiCastingAndLocationModal } from '../../components/modals/AiCastingAndLocationModal';
import { uploadFileToFirebaseStorage } from '../../services/firebase';
import {
  Clapperboard,
  FileText,
  Upload,
  Users,
  Music,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Play,
  ThumbsUp,
  RotateCcw,
  Plus,
  Send,
  Eye,
  Camera,
  Layers,
  MapPin,
  Clock,
  Edit3,
  UserCheck,
  Award,
  Pencil,
  Trash2,
  Megaphone
} from 'lucide-react';

export const DirectorDashboard = () => {
  const { user } = useAuth();
  const { activeMovie, scenes, characters, refreshActiveMovieData, deleteMovie, loading: movieLoading } = useMovie();
  const { showToast } = useNotifications();
  const location = useLocation();

  // Auto-sync real-time data so actor acceptance updates immediately
  useEffect(() => {
    const interval = setInterval(() => {
      refreshActiveMovieData();
    }, 4000);
    return () => clearInterval(interval);
  }, [refreshActiveMovieData]);

  // Tab State: 'breakdown' | 'casting' | 'music' | 'upload'
  const [activeTab, setActiveTab] = useState('overview');

  // Modals & Talent State
  const [editingScene, setEditingScene] = useState(null);
  const [isEditSceneModalOpen, setIsEditSceneModalOpen] = useState(false);
  const [isEditMovieModalOpen, setIsEditMovieModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isAiCastingLocationModalOpen, setIsAiCastingLocationModalOpen] = useState(false);
  const [aiModalInitialTab, setAiModalInitialTab] = useState('casting');

  const [talentList, setTalentList] = useState([]);
  const [selectedTalentForProfile, setSelectedTalentForProfile] = useState(null);
  const [isTalentModalOpen, setIsTalentModalOpen] = useState(false);

  const handleDeleteProduction = async () => {
    if (!activeMovie?.id) return;
    if (!window.confirm(`CRITICAL ACTION: Are you sure you want to permanently delete the production '${activeMovie.title}' and all its associated data from Firestore?`)) return;
    try {
      await deleteMovie(activeMovie.id);
      showToast(`Production '${activeMovie.title}' deleted successfully.`, "info");
    } catch (err) {
      alert(`Error deleting production: ${err.message}`);
    }
  };

  // Sync hash location to tab selection
  useEffect(() => {
    if (location.hash) {
      const h = location.hash.replace('#', '');
      if (['overview', 'breakdown', 'scenes', 'casting', 'music', 'upload'].includes(h)) {
        if (h === 'scenes' || h === 'breakdown') {
          setActiveTab('scenes');
        } else {
          setActiveTab(h);
        }
      }
    } else {
      setActiveTab('overview');
    }
  }, [location.hash]);

  const changeTab = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
  };

  // Filters
  const [selectedSetting, setSelectedSetting] = useState('ALL');
  const [selectedTime, setSelectedTime] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Script upload modal/state
  const [scriptText, setScriptText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Casting modal state
  const [isCastingModalOpen, setIsCastingModalOpen] = useState(false);
  const [preselectedChar, setPreselectedChar] = useState(null);
  const [castingRequests, setCastingRequests] = useState([]);

  // Music tracks state
  const [musicTracks, setMusicTracks] = useState([]);
  const [selectedReviewTrack, setSelectedReviewTrack] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  useEffect(() => {
    if (activeMovie?.id) {
      castingApi.getMovieCastingRequests(activeMovie.id).then(setCastingRequests).catch(() => { });
      musicApi.getTracks(activeMovie.id).then(setMusicTracks).catch(() => { });
    }
  }, [activeMovie?.id]);

  const handleScriptUpload = async (e) => {
    e.preventDefault();
    if (!activeMovie?.id) return;
    setUploading(true);

    try {
      let storageUrl = null;
      if (selectedFile) {
        try {
          // Upload screenplay document to Firebase Storage
          storageUrl = await uploadFileToFirebaseStorage(selectedFile, `screenplays/${activeMovie.id}`);
          if (storageUrl) {
            showToast("📄 Screenplay PDF uploaded to Firebase Storage!", "success");
          }
        } catch (storageErr) {
          console.warn("Firebase Storage note:", storageErr.message);
        }

        await scriptApi.uploadScriptFile(activeMovie.id, selectedFile);
      } else if (scriptText.trim()) {
        await scriptApi.analyzeScriptText(activeMovie.id, scriptText);
      } else {
        alert("Please enter screenplay text or select a file.");
        setUploading(false);
        return;
      }

      showToast("🎬 Screenplay analyzed! Scenes and characters extracted with Gemini AI & stored in Firestore.", "success");
      await refreshActiveMovieData();
      setActiveTab('breakdown');
    } catch (err) {
      alert(`Script analysis error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleReviewTrackSubmit = async (status) => {
    if (!selectedReviewTrack) return;
    try {
      await musicApi.reviewTrack(selectedReviewTrack.id, status, reviewFeedback || "Directorial review completed.", reviewRating);
      showToast(`Soundtrack cue marked as ${status}!`, "success");
      const updated = await musicApi.getTracks(activeMovie.id);
      setMusicTracks(updated);
      setSelectedReviewTrack(null);
      setReviewFeedback('');
    } catch (err) {
      alert(`Review error: ${err.message}`);
    }
  };

  if (movieLoading) return <LoadingSkeleton count={3} />;

  if (!activeMovie) {
    return (
      <EmptyState
        title="No Cinema Production Selected"
        description="Select or create a movie production to access the Director Workspace."
      />
    );
  }

  // Filter scenes
  const filteredScenes = scenes.filter((s) => {
    if (selectedSetting !== 'ALL' && s.setting !== selectedSetting) return false;
    if (selectedTime !== 'ALL' && s.timeOfDay !== selectedTime) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchHead = s.heading?.toLowerCase().includes(q);
      const matchLoc = s.location?.toLowerCase().includes(q);
      const matchChar = s.characters?.some(c => c.toLowerCase().includes(q));
      if (!matchHead && !matchLoc && !matchChar) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* 1. Director Header & Metrics */}
      <div className="cinema-glass rounded-3xl p-6 sm:p-8 border border-amber-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                DIRECTOR SUITE
              </span>
              <span className="text-xs text-slate-400 font-medium">Director: {user?.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 font-['Cinzel'] tracking-wide">
              {activeMovie.title}
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
              {activeMovie.logline || activeMovie.synopsis}
            </p>
          </div>

          {/* Quick Metrics & Production Controls */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
            <div className="bg-slate-900/80 border border-slate-800 px-4 py-3 rounded-2xl text-center min-w-[90px]">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Scenes</p>
              <p className="text-xl font-black text-amber-400 font-['Outfit']">{scenes.length}</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 px-4 py-3 rounded-2xl text-center min-w-[90px]">
              <p className="text-[10px] uppercase font-bold text-slate-400">Characters</p>
              <p className="text-xl font-black text-cyan-400 font-['Outfit']">{characters.length}</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 px-4 py-3 rounded-2xl text-center min-w-[90px]">
              <p className="text-[10px] uppercase font-bold text-slate-400">Music Cues</p>
              <p className="text-xl font-black text-emerald-400 font-['Outfit']">{musicTracks.length}</p>
            </div>

            {/* Edit, Announcement & Delete Action Pills */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <button
                onClick={() => setIsAnnouncementModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-500/30 shadow-md"
                title="Dispatch Announcement to Crew"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Announcement</span>
              </button>
              <button
                onClick={() => setIsEditMovieModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-500/30 shadow-md"
                title="Edit Production Details"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDeleteProduction}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-500/30 shadow-md"
                title="Delete Production"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => changeTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
          >
            <Clapperboard className="w-4 h-4" />
            Director Suite
          </button>

          <button
            onClick={() => changeTab('scenes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'scenes' || activeTab === 'breakdown'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
          >
            <FileText className="w-4 h-4" />
            Screenplay & Scenes ({scenes.length})
          </button>

          <button
            onClick={() => changeTab('casting')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'casting'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
          >
            <Users className="w-4 h-4" />
            Casting Dispatch ({characters.length})
          </button>

          <button
            onClick={() => changeTab('music')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'music'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
          >
            <Music className="w-4 h-4" />
            Score & Music Reviews ({musicTracks.length})
          </button>

          <button
            onClick={() => changeTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'upload'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
          >
            <Upload className="w-4 h-4" />
            Upload Screenplay
          </button>
        </div>
      </div>

      {/* 1. TAB: DIRECTOR SUITE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Directorial Vision & Command Hub */}
          <div className="cinema-glass rounded-3xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-br from-amber-500/5 via-slate-900/60 to-slate-950/80 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                    <Clapperboard className="w-3 h-3 text-amber-400" />
                    Directorial Command Room
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                    {activeMovie?.status?.replace('_', ' ') || 'PRE PRODUCTION'}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-100 font-['Outfit'] tracking-tight">
                  Directorial Vision: {activeMovie?.title || 'Active Production'}
                </h2>
                <p className="text-sm text-slate-300 mt-2.5 leading-relaxed">
                  {activeMovie?.logline || "An ambitious cinematic narrative driven by character conflict, immersive worldbuilding, and precise visual pacing."}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-400">
                  <span>Genre: <strong className="text-amber-400">{Array.isArray(activeMovie?.genre) ? activeMovie?.genre.join(', ') : (activeMovie?.genre || 'Action / Neo-Noir')}</strong></span>
                  <span>•</span>
                  <span>Shooting Stage: <strong className="text-slate-200">{activeMovie?.productionStage || 'Pre-Production Setup'}</strong></span>
                  <span>•</span>
                  <span>Studio: <strong className="text-slate-200">{activeMovie?.productionCompany || 'MovieOS Studio'}</strong></span>
                </div>
              </div>

              {/* Direct Action Hub */}
              <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0">
                <button
                  onClick={() => changeTab('scenes')}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <FileText className="w-4 h-4" />
                  Explore Screenplay ({scenes.length} Scenes)
                </button>
                <button
                  onClick={() => changeTab('casting')}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500/50 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4 text-amber-400" />
                  Manage Cast ({characters.length} Roles)
                </button>
                <button
                  onClick={() => {
                    setAiModalInitialTab('casting');
                    setIsAiCastingLocationModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  Run Directorial AI Assistant
                </button>
              </div>
            </div>
          </div>

          {/* Directorial Metric Intelligence Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Scenes */}
            <div 
              onClick={() => changeTab('scenes')}
              className="cinema-glass rounded-2xl p-5 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400">Screenplay Scenes</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-100 font-['Outfit']">{scenes.length}</p>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="text-amber-400 font-semibold">{scenes.filter(s => s.setting === 'INT').length} INT</span>
                <span>•</span>
                <span className="text-cyan-400 font-semibold">{scenes.filter(s => s.setting === 'EXT').length} EXT</span>
                <span>•</span>
                <span className="text-slate-300">{scenes.filter(s => s.timeOfDay === 'NIGHT').length} Night</span>
              </p>
            </div>

            {/* Metric 2: Characters & Cast */}
            <div 
              onClick={() => changeTab('casting')}
              className="cinema-glass rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400">Character Roster</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-100 font-['Outfit']">
                {characters.filter(c => c.castingStatus === 'CAST' || c.status === 'CAST' || Boolean(c.actorName)).length} / {characters.length}
              </p>
              <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Lead Roles Cast & Signed
              </p>
            </div>

            {/* Metric 3: Score Reviews */}
            <div 
              onClick={() => changeTab('music')}
              className="cinema-glass rounded-2xl p-5 border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400">Score & Music Cues</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-slate-950 transition-colors">
                  <Music className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-100 font-['Outfit']">{musicTracks.length}</p>
              <p className="text-xs text-purple-400 font-semibold mt-1">
                Original Soundtrack In Review
              </p>
            </div>

            {/* Metric 4: Directorial Readiness */}
            <div 
              onClick={() => {
                setAiModalInitialTab('casting');
                setIsAiCastingLocationModalOpen(true);
              }}
              className="cinema-glass rounded-2xl p-5 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400">AI Directorial Intelligence</span>
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-cyan-400 font-['Outfit']">100%</p>
              <p className="text-xs text-cyan-300 font-semibold mt-1">
                Directorial Breakdown Ready
              </p>
            </div>
          </div>

          {/* Directorial Highlights: Scenes Preview & Cast Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Highlights 1: Featured Screenplay Scenes */}
            <div className="cinema-glass rounded-2xl p-6 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Screenplay Scenes Preview</h3>
                  <p className="text-xs text-slate-400">Key narrative beats and shooting setups</p>
                </div>
                <button
                  onClick={() => changeTab('scenes')}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  View All ({scenes.length}) →
                </button>
              </div>

              {scenes.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-6 text-center">No scenes extracted yet. Upload screenplay to begin.</p>
              ) : (
                <div className="space-y-3">
                  {scenes.slice(0, 3).map((scene) => (
                    <div
                      key={scene.id || scene.sceneNumber}
                      onClick={() => changeTab('scenes')}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/30 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 font-black text-xs flex items-center justify-center">
                          {scene.sceneNumber}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-100 flex items-center gap-2">
                            <span>{scene.setting} {scene.location}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">{scene.timeOfDay}</span>
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{scene.summary || scene.description}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-400/80 bg-amber-500/5 px-2 py-1 rounded">
                        {scene.emotionalTone || 'Dramatic'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Highlights 2: Character Cast Status & Green Signals */}
            <div className="cinema-glass rounded-2xl p-6 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Cast & Talent Roster</h3>
                  <p className="text-xs text-slate-400">Confirmed actors and active casting</p>
                </div>
                <button
                  onClick={() => changeTab('casting')}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  Manage Casting ({characters.length}) →
                </button>
              </div>

              {characters.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-6 text-center">No characters extracted yet.</p>
              ) : (
                <div className="space-y-3">
                  {characters.slice(0, 3).map((char) => {
                    const isCast = char.castingStatus === 'CAST' || char.status === 'CAST' || Boolean(char.actorName);
                    return (
                      <div
                        key={char.id}
                        onClick={() => changeTab('casting')}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isCast ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isCast ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isCast ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Users className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-100 flex items-center gap-2">
                              <span>{char.name}</span>
                              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">{char.roleType || 'Role'}</span>
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {isCast ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <UserCheck className="w-3 h-3" /> Signed: {char.actorName || 'Confirmed Actor'}
                                </span>
                              ) : (
                                <span className="italic text-slate-500">Unassigned — Open for offer</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {isCast ? (
                          <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-1 rounded-full flex items-center gap-1">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            CAST
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded">
                            OFFER
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB: SCENE BREAKDOWN */}
      {(activeTab === 'scenes' || activeTab === 'breakdown') && (
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 cinema-glass p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search scenes, characters, locations..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Setting Filter */}
              <select
                value={selectedSetting}
                onChange={(e) => setSelectedSetting(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="ALL">All Settings (INT/EXT)</option>
                <option value="INT">INT (Interior)</option>
                <option value="EXT">EXT (Exterior)</option>
              </select>

              {/* Time Filter */}
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="ALL">All Times</option>
                <option value="DAY">DAY</option>
                <option value="NIGHT">NIGHT</option>
                <option value="DUSK">DUSK</option>
                <option value="DAWN">DAWN</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={() => {
                  setAiModalInitialTab('casting');
                  setIsAiCastingLocationModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                title="Real-Time AI Roles & Actor/Actress Casting Suggestions based on Script"
              >
                <Users className="w-3.5 h-3.5" />
                <span>AI Roles & Casting</span>
              </button>

              <button
                onClick={() => {
                  setAiModalInitialTab('locations');
                  setIsAiCastingLocationModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                title="Real-Time AI Shooting Location Places Suggestions based on Script"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>AI Location Places</span>
              </button>

              <button
                onClick={() => setActiveTab('upload')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/20"
                title="Execute Automated Screenplay Scene Breakdown"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>AI Scene Breakdown</span>
              </button>
            </div>
          </div>

          {/* Scenes Grid */}
          {filteredScenes.length === 0 ? (
            <EmptyState
              title="No Scenes Found"
              description="No scenes match the selected filter, or no screenplay has been analyzed yet."
              actionLabel="Upload Screenplay"
              onAction={() => setActiveTab('upload')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredScenes.map((scene) => (
                <div
                  key={scene.id || scene.sceneNumber}
                  className="cinema-glass rounded-2xl p-5 sm:p-6 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Scene Header */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[11px] font-mono font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                        SCENE #{scene.sceneNumber}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        <span className={`px-2 py-0.5 rounded ${scene.setting === 'EXT' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'}`}>
                          {scene.setting}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {scene.timeOfDay}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {scene.status}
                        </span>
                        <button
                          onClick={() => {
                            setEditingScene(scene);
                            setIsEditSceneModalOpen(true);
                          }}
                          className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer flex items-center gap-1 font-bold"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 font-['Cinzel'] tracking-wide">
                      {scene.heading}
                    </h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {scene.synopsis}
                    </p>

                    {/* Dialogue Snippet */}
                    {scene.keyDialogueSnippet && (
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-900/80 border-l-2 border-amber-400 text-[11px] text-amber-200/90 italic">
                        "{scene.keyDialogueSnippet}"
                      </div>
                    )}
                  </div>

                  {/* Scene Specs Footer */}
                  <div className="space-y-3 pt-3 border-t border-slate-800/80 text-[11px]">
                    {/* Characters */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">Cast:</span>
                      <div className="flex flex-wrap gap-1">
                        {scene.characters?.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-semibold">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tone & Music Cue */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Tone: <strong className="text-slate-200">{scene.emotionalTone}</strong></span>
                      {scene.musicCue && (
                        <span className="text-amber-400 truncate max-w-[200px]" title={scene.musicCue}>
                          🎵 {scene.musicCue}
                        </span>
                      )}
                    </div>

                    {/* Shot Suggestions */}
                    {scene.shotListSuggestions && scene.shotListSuggestions.length > 0 && (
                      <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Camera className="w-3 h-3" /> Directorial Shot Suggestions
                        </p>
                        <ul className="text-[10px] text-slate-300 space-y-0.5 list-disc list-inside">
                          {scene.shotListSuggestions.slice(0, 2).map((shot, idx) => (
                            <li key={idx} className="truncate">{shot}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. TAB: CASTING DISPATCH */}
      {activeTab === 'casting' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between cinema-glass p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Production Cast & Talent Roster</h3>
              <p className="text-xs text-slate-400">Manage character assignments and dispatch live casting contracts</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setAiModalInitialTab('casting');
                  setIsAiCastingLocationModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
                title="Use Gemini AI to analyze roles and suggest top actor/actress choices"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                AI Suggest Actors Based on Roles
              </button>
              <button
                onClick={async () => {
                  try {
                    const users = await authApi.getUsers();
                    setTalentList(users || []);
                    if (users && users.length > 0) {
                      const actor = users.find(u => u.role === 'ACTOR') || users[0];
                      setSelectedTalentForProfile(actor);
                      setIsTalentModalOpen(true);
                    }
                  } catch (e) {}
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500/50 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                Browse Talent Profiles
              </button>
              <button
                onClick={() => {
                  setPreselectedChar(null);
                  setIsCastingModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch Casting Offer
              </button>
            </div>
          </div>

          {characters.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Characters Extracted Yet"
              description="Upload and analyze a screenplay in the 'Screenplay Upload' tab to extract characters and dispatch casting offers."
              actionLabel="Go to Screenplay Upload"
              onAction={() => setActiveTab('upload')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map((char) => {
                const isCast = char.castingStatus === 'CAST' || char.status === 'CAST' || Boolean(char.actorName);
                const isPending = char.castingStatus === 'PENDING' || char.status === 'PENDING';
                return (
                  <div
                    key={char.id}
                    className={`cinema-glass rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                      isCast 
                        ? 'border-emerald-500/50 bg-emerald-950/15 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/20' 
                        : isPending
                          ? 'border-amber-500/40 bg-amber-950/10 shadow-lg'
                          : 'border-slate-800 hover:border-amber-500/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                          {char.roleType || 'Lead / Supporting'}
                        </span>
                        
                        {/* Live Status Signal Badge */}
                        {isCast ? (
                          <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            CAST & SIGNED
                          </span>
                        ) : isPending ? (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                            OFFER PENDING
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            UNASSIGNED
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-slate-100 font-['Outfit'] flex items-center justify-between">
                        <span>{char.name}</span>
                        {isCast && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                        {char.description}
                      </p>

                      {/* Assigned Actor Display & Green Signal Card */}
                      {isCast ? (
                        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900/80 border border-emerald-500/30">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Confirmed Talent
                            </p>
                            <span className="text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                              Contract Signed
                            </span>
                          </div>
                          <p className="text-sm font-extrabold text-white flex items-center gap-2 mt-0.5">
                            <UserCheck className="w-4 h-4 text-emerald-400" />
                            {char.actorName || "Kavin Raj"}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Assigned Talent</p>
                          <p className="text-xs text-slate-400 italic mt-0.5">Unassigned — No actor cast yet</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400">
                        Appears in {char.sceneCount || char.scenesAppearedIn?.length || 0} scenes
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setAiModalInitialTab('casting');
                            setIsAiCastingLocationModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 font-bold text-xs transition-all cursor-pointer border border-cyan-500/30 flex items-center gap-1 shadow-sm"
                          title={`AI Suggest Actors for ${char.name}`}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>AI Suggest</span>
                        </button>
                        {!isCast && (
                          <button
                            onClick={() => {
                              setPreselectedChar(char);
                              setIsCastingModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold text-xs transition-all cursor-pointer border border-amber-500/30"
                          >
                            Offer Role
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

      {/* 4. TAB: SCORE & MUSIC REVIEWS */}
      {activeTab === 'music' && (
        <div className="space-y-6">
          <div className="cinema-glass p-4 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-slate-100">Directorial Soundtrack Review Studio</h3>
            <p className="text-xs text-slate-400">Listen to submitted orchestral cues, leitmotifs, and approve or request revisions</p>
          </div>

          {musicTracks.length === 0 ? (
            <EmptyState
              icon={Music}
              title="No Soundtracks Submitted"
              description="The Music Director has not submitted any cue demos yet."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {musicTracks.map((trk) => {
                const isApproved = trk.status === 'APPROVED';
                return (
                  <div
                    key={trk.id}
                    className={`cinema-glass rounded-2xl p-6 border transition-all flex flex-col justify-between ${isApproved ? 'border-emerald-500/30 bg-emerald-950/5' : 'border-slate-800 hover:border-amber-500/30'
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {trk.trackType} • {trk.mood}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isApproved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          }`}>
                          {trk.status}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-100 font-['Outfit']">{trk.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{trk.notes}</p>

                      {/* Waveform Amplitude Display */}
                      <div className="mt-4 p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-end gap-1.5 h-14 overflow-hidden relative">
                        {(trk.waveformPeaks && trk.waveformPeaks.length > 0 ? trk.waveformPeaks : [25, 60, 90, 45, 80, 100, 70, 50, 85, 30, 65, 95, 40, 20]).map((p, i) => {
                          const val = typeof p === 'number' ? (p > 1 ? p : p * 100) : 50;
                          const heightPct = Math.min(100, Math.max(15, Math.round(val)));
                          return (
                            <div
                              key={i}
                              className="flex-1 bg-gradient-to-t from-amber-500 to-amber-300 rounded-full transition-all duration-300"
                              style={{ height: `${heightPct}%`, minHeight: '6px' }}
                            />
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400 font-mono">
                        <span>BPM: {trk.bpm} • KEY: {trk.keySignature}</span>
                        <span>DURATION: {Math.floor(trk.durationSeconds / 60)}:{(trk.durationSeconds % 60).toString().padStart(2, '0')}</span>
                      </div>

                      {/* Director Feedback if already recorded */}
                      {trk.directorFeedback && (
                        <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-200">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Directorial Note</p>
                          <p className="mt-0.5">{trk.directorFeedback}</p>
                        </div>
                      )}
                    </div>

                    {/* Review Action Controls */}
                    <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                      <audio controls className="w-full max-w-[200px] h-8 opacity-80" src={trk.audioUrl} />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedReviewTrack(trk)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Review Cue
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Review Modal Form */}
          {selectedReviewTrack && (
            <div className="cinema-glass rounded-3xl p-6 border border-amber-500/40 mt-6 animate-in zoom-in-95">
              <h4 className="text-sm font-bold text-slate-100 font-['Outfit'] mb-2">
                Directorial Feedback on "{selectedReviewTrack.title}"
              </h4>
              <textarea
                rows={3}
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder="Provide notes to the Music Director (e.g. 'Loved the solo cello entry, but let's build the percussion 4 bars earlier')..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-amber-500 focus:outline-none mb-3"
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedReviewTrack(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReviewTrackSubmit('REVISION_REQUESTED')}
                  className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs hover:bg-amber-500 hover:text-slate-950 transition-colors"
                >
                  Request Revision
                </button>
                <button
                  onClick={() => handleReviewTrackSubmit('APPROVED')}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-colors"
                >
                  Approve Track 🎉
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB: UPLOAD SCREENPLAY */}
      {activeTab === 'upload' && (
        <div className="cinema-glass rounded-3xl p-6 sm:p-8 border border-cyan-500/30 max-w-3xl mx-auto space-y-6">
          <div className="text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 font-['Outfit']">Gemini Screenplay Breakdown Pipeline</h3>
            <p className="text-xs text-slate-400 mt-1">
              Upload a Screenplay PDF, text document, or paste dialogue text. Gemini extracts structured scenes, characters, emotional arcs, props, and VFX directly into Firestore.
            </p>
          </div>

          <form onSubmit={handleScriptUpload} className="space-y-4">
            {/* File Upload Zone */}
            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-2xl p-6 text-center transition-colors">
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="hidden"
                id="script-file-input"
              />
              <label htmlFor="script-file-input" className="cursor-pointer">
                <FileText className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-200">
                  {selectedFile ? selectedFile.name : "Click to browse Screenplay PDF or Text"}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Supports industry standard Hollywood formats (.pdf, .txt)</p>
              </label>
            </div>

            <div className="text-center text-xs uppercase font-bold text-slate-400 my-2">— OR PASTE SCREENPLAY TEXT —</div>

            <textarea
              rows={8}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="INT. SECTOR 9 NEON SUB-LEVEL - NIGHT\n\nAcid rain cascades down monolithic skyscraper billboards...\n\nVESPER\nIf the pulse sweeps this grid before midnight, we are both ghosts."
              className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none font-mono"
            />

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {uploading ? "Analyzing Screenplay with Gemini..." : "Execute Automated AI Breakdown"}
            </button>
          </form>
        </div>
      )}

      {/* Casting Modal */}
      <CastingRequestModal
        isOpen={isCastingModalOpen}
        onClose={() => setIsCastingModalOpen(false)}
        preselectedCharacter={preselectedChar}
      />

      {/* Edit Scene Breakdown Modal */}
      <EditSceneModal
        isOpen={isEditSceneModalOpen}
        onClose={() => setIsEditSceneModalOpen(false)}
        scene={editingScene}
        onSaveSuccess={refreshActiveMovieData}
      />

      {/* Talent Profile Modal */}
      <TalentProfileModal
        isOpen={isTalentModalOpen}
        onClose={() => setIsTalentModalOpen(false)}
        talent={selectedTalentForProfile}
        onDispatchOffer={(talentItem) => {
          setPreselectedChar(null);
          setIsCastingModalOpen(true);
        }}
      />

      {/* Edit Movie Details Modal */}
      <EditMovieModal
        isOpen={isEditMovieModalOpen}
        onClose={() => setIsEditMovieModalOpen(false)}
        movie={activeMovie}
      />

      {/* Crew Announcement Modal */}
      <CreateAnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
      />

      {/* AI Roles & Casting + Location Suggestions Modal */}
      <AiCastingAndLocationModal
        isOpen={isAiCastingLocationModalOpen}
        onClose={() => setIsAiCastingLocationModalOpen(false)}
        initialTab={aiModalInitialTab}
        movieId={activeMovie?.id}
        movieTitle={activeMovie?.title}
        onDispatchCasting={(actor) => {
          setPreselectedChar(null);
          setIsCastingModalOpen(true);
        }}
      />
    </div>
  );
};
