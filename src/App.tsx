import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Search, 
  Upload, 
  Heart, 
  History, 
  Filter, 
  X, 
  Volume2, 
  VolumeX,
  ChevronRight,
  Tv,
  Info,
  Link as LinkIcon,
  Trash2,
  Star,
  Plus,
  Globe,
  User,
  LayoutGrid,
  Home
} from 'lucide-react';
import Hls from 'hls.js';
import { cn } from './lib/utils';
import { IPTVChannel, PlaylistData, DEMO_CHANNELS } from './types';
import { parseM3U } from './parser';

// --- Components ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass w-full max-w-md md:rounded-3xl p-6 relative animate-fade-in border border-white/20 shadow-2xl h-full md:h-auto overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={cn(
      "fixed bottom-6 left-6 right-6 md:left-auto md:w-auto z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in",
      type === 'success' ? "bg-green-600 text-white" : "bg-red-600 text-white"
    )}>
      {type === 'success' ? <Star size={20} /> : <Info size={20} />}
      <span className="font-bold text-sm">{message}</span>
    </div>
  );
};

export default function App() {
  // --- State ---
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null);
  const [currentChannel, setCurrentChannel] = useState<IPTVChannel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<IPTVChannel[]>([]);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number, message: string, type: 'success' | 'error' }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannel, setNewChannel] = useState({
    name: '',
    url: '',
    logo: '',
    category: 'General'
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // --- Initialization ---
  useEffect(() => {
    const savedPlaylist = localStorage.getItem('smiletv_playlist');
    const savedFavorites = localStorage.getItem('smiletv_favorites');
    const savedHistory = localStorage.getItem('smiletv_history');

    if (savedPlaylist) {
      setPlaylist(JSON.parse(savedPlaylist));
    } else {
      // Load demo channels if nothing saved
      setPlaylist({
        name: 'iptv-org Playlist',
        channels: DEMO_CHANNELS,
        categories: Array.from(new Set(DEMO_CHANNELS.map(c => c.category))).sort()
      });
    }

    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // --- Persistence ---
  useEffect(() => {
    if (playlist) localStorage.setItem('smiletv_playlist', JSON.stringify(playlist));
  }, [playlist]);

  useEffect(() => {
    localStorage.setItem('smiletv_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('smiletv_history', JSON.stringify(history));
  }, [history]);

  // --- Video Logic ---
  useEffect(() => {
    let hls: Hls | null = null;
    if (currentChannel && videoRef.current) {
      const video = videoRef.current;
      const streamUrl = currentChannel.url;

      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(e => console.error("Autoplay blocked", e));
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls?.recoverMediaError();
                break;
              default:
                hls?.destroy();
                addToast("Stream error. Try another channel.", "error");
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari support
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(() => {});
        });
      }
    }
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [currentChannel]);

  // --- Handlers ---
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const parsed = parseM3U(content);
        setPlaylist(parsed);
        addToast(`Successfully loaded ${parsed.channels.length} channels`, "success");
      };
      reader.readAsText(file);
    }
  };

  const handleUrlLoad = async () => {
    if (!urlInput) return;
    try {
      const response = await fetch(urlInput);
      if (!response.ok) throw new Error("Failed to fetch");
      const content = await response.text();
      const parsed = parseM3U(content);
      setPlaylist(parsed);
      setShowUrlInput(false);
      setUrlInput('');
      addToast(`Successfully loaded ${parsed.channels.length} channels from URL`, "success");
    } catch (error) {
      console.error("URL Load Error:", error);
      addToast("Failed to load. This is likely a CORS issue. Try a different link or upload the file.", "error");
    }
  };

  const handleAddManualChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannel.name || !newChannel.url) {
      addToast("Name and URL are required", "error");
      return;
    }

    const channel: IPTVChannel = {
      id: `manual-${Date.now()}`,
      name: newChannel.name,
      url: newChannel.url,
      logo: newChannel.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(newChannel.name)}&background=random`,
      category: newChannel.category || 'General',
      number: (playlist?.channels.length || 0) + 1
    };

    setPlaylist(prev => {
      if (!prev) {
        return {
          name: 'My Playlist',
          channels: [channel],
          categories: [channel.category]
        };
      }
      const newCategories = Array.from(new Set([...prev.categories, channel.category])).sort();
      return {
        ...prev,
        channels: [...prev.channels, channel],
        categories: newCategories
      };
    });

    setShowAddChannel(false);
    setNewChannel({ name: '', url: '', logo: '', category: 'General' });
    addToast("Channel added successfully", "success");
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const playChannel = (channel: IPTVChannel) => {
    setCurrentChannel(channel);
    setIsPlayerOpen(true);
    setHistory(prev => {
      const filtered = prev.filter(c => c.id !== channel.id);
      return [channel, ...filtered].slice(0, 10);
    });
  };

  const clearPlaylist = () => {
    if (window.confirm("Reset to default iptv-org channels?")) {
      setPlaylist({
        name: 'iptv-org Playlist',
        channels: DEMO_CHANNELS,
        categories: Array.from(new Set(DEMO_CHANNELS.map(c => c.category))).sort()
      });
      localStorage.removeItem('smiletv_playlist');
      addToast("Reset to default channels", "success");
    }
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPlayerOpen(false);
      if (e.key === 'f' || e.key === 'F') {
        if (videoRef.current) {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            videoRef.current.requestFullscreen();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Filtering ---
  const filteredChannels = useMemo(() => {
    if (!playlist) return [];
    return playlist.channels.filter(ch => {
      const matchesSearch = ch.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || ch.category === selectedCategory;
      const isFavorite = selectedCategory === 'Favorites' ? favorites.includes(ch.id) : true;
      return matchesSearch && matchesCategory && isFavorite;
    });
  }, [playlist, searchQuery, selectedCategory, favorites]);

  const categories = useMemo(() => {
    if (!playlist) return ['All', 'Favorites'];
    return ['All', 'Favorites', ...playlist.categories];
  }, [playlist]);

  // --- Drag & Drop ---
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.m3u')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const parsed = parseM3U(content);
        setPlaylist(parsed);
        addToast(`Successfully loaded ${parsed.channels.length} channels`, "success");
      };
      reader.readAsText(file);
    } else {
      addToast("Please drop a valid .m3u file", "error");
    }
  };

  return (
    <div 
      className="min-h-screen pb-20 relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-[200] bg-orange-600/20 backdrop-blur-md border-4 border-dashed border-orange-500 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Upload size={64} className="mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl font-bold">Drop M3U Playlist Here</h2>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#050505] px-4 py-6 md:px-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/30">
              <Tv className="text-white" size={20} />
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">Smile<span className="text-orange-500">TV</span></h1>
              <span className="text-lg font-medium text-slate-400">PH</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <User size={24} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            id="input-search-channels"
            type="text" 
            placeholder="Search channels..." 
            className="glass-input w-full pl-14"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div id="container-categories" className="flex gap-3 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <button
              id={`btn-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-6 py-2.5 rounded-xl whitespace-nowrap transition-all font-semibold border text-sm",
                selectedCategory === cat 
                  ? "category-active" 
                  : "bg-[#1a1a1a] border-white/5 text-slate-400 hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-8">
        {/* Recently Watched */}
        {history.length > 0 && selectedCategory === 'All' && !searchQuery && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <History size={20} className="text-orange-500" />
              <h2 className="text-xl font-bold">Recently Watched</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {history.map(ch => (
                <button 
                  key={`hist-${ch.id}`}
                  onClick={() => playChannel(ch)}
                  className="flex-shrink-0 w-40 group"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-2 glass border border-white/10 group-hover:border-orange-500/50 transition-all">
                    <img src={ch.logo} alt={ch.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="text-white fill-white" size={24} />
                    </div>
                  </div>
                  <p className="text-sm font-medium truncate text-left">{ch.name}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Channel Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredChannels.map(ch => (
            <div 
              key={ch.id}
              onClick={() => playChannel(ch)}
              className="glass-card group cursor-pointer relative flex flex-col p-4"
            >
              <div className="absolute top-4 left-4 z-10 bg-orange-600 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shadow-lg shadow-orange-600/20">
                #{ch.number}
              </div>
              <button 
                onClick={(e) => toggleFavorite(ch.id, e)}
                className="absolute top-4 right-4 z-10 p-1 text-slate-400 hover:text-white transition-colors"
              >
                <Heart 
                  size={20} 
                  className={cn(favorites.includes(ch.id) ? "fill-red-500 text-red-500" : "")} 
                />
              </button>
              
              <div className="flex-1 flex items-center justify-center py-8">
                <img 
                  src={ch.logo} 
                  alt={ch.name} 
                  className="max-w-[80%] max-h-[100px] object-contain group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="mt-auto">
                <h3 className="font-bold text-base text-white truncate mb-0.5 group-hover:text-orange-500 transition-colors">{ch.name}</h3>
                <p className="text-xs text-slate-500 truncate mb-3">{ch.category}</p>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1080p</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">LIVE</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredChannels.length === 0 && (
          <div className="text-center py-20 glass rounded-3xl border-dashed border-2 border-white/10">
            <Tv size={48} className="mx-auto mb-4 text-slate-600" />
            <h2 className="text-xl font-bold text-slate-400">No channels found</h2>
            <p className="text-slate-500">Try uploading a playlist or changing filters</p>
          </div>
        )}
      </main>

      {/* Add Channel Modal */}
      <Modal 
        isOpen={showAddChannel} 
        onClose={() => setShowAddChannel(false)} 
        title="Add New Channel"
      >
        <form id="form-add-channel" onSubmit={handleAddManualChannel} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Channel Name</label>
            <input 
              id="input-manual-name"
              type="text" 
              placeholder="e.g. BBC One" 
              className="glass-input w-full"
              value={newChannel.name}
              onChange={(e) => setNewChannel({...newChannel, name: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stream URL (.m3u8)</label>
            <input 
              id="input-manual-url"
              type="url" 
              placeholder="https://example.com/stream.m3u8" 
              className="glass-input w-full"
              value={newChannel.url}
              onChange={(e) => setNewChannel({...newChannel, url: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Logo URL (Optional)</label>
            <input 
              id="input-manual-logo"
              type="url" 
              placeholder="https://example.com/logo.png" 
              className="glass-input w-full"
              value={newChannel.logo}
              onChange={(e) => setNewChannel({...newChannel, logo: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</label>
            <input 
              id="input-manual-category"
              type="text" 
              placeholder="e.g. News, Sports" 
              className="glass-input w-full"
              value={newChannel.category}
              onChange={(e) => setNewChannel({...newChannel, category: e.target.value})}
            />
          </div>
          <button id="btn-submit-channel" type="submit" className="btn-primary w-full justify-center mt-4">
            Add Channel
          </button>
        </form>
      </Modal>

      {/* Sticky Player Overlay */}
      {isPlayerOpen && currentChannel && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex flex-col md:flex-row animate-fade-in">
          <div className="relative flex-1 bg-black flex items-center justify-center">
            <video 
              ref={videoRef}
              className="w-full h-full max-h-screen object-contain"
              controls
              autoPlay
            />
            <button 
              onClick={() => setIsPlayerOpen(false)}
              className="absolute top-6 right-6 p-3 rounded-full glass hover:bg-white/20 transition-all z-[110]"
            >
              <X size={24} />
            </button>
          </div>

          <div className="w-full md:w-96 glass border-l border-white/10 p-6 flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-2 block">Now Playing</span>
                <h2 className="text-2xl font-bold leading-tight">{currentChannel.name}</h2>
                <p className="text-slate-400 mt-1">{currentChannel.category}</p>
              </div>
              <button 
                onClick={(e) => toggleFavorite(currentChannel.id, e)}
                className="p-3 rounded-xl glass hover:bg-white/20 transition-all"
              >
                <Heart 
                  size={24} 
                  className={cn(favorites.includes(currentChannel.id) ? "fill-red-500 text-red-500" : "text-white")} 
                />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 p-4 rounded-2xl">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-500 font-bold text-sm uppercase tracking-wider">Live Stream Active</span>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">TV Guide (EPG)</h3>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="glass p-3 rounded-xl border-white/5 opacity-50">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold">Upcoming Program {i}</span>
                      <span className="text-slate-500">1{i}:00 PM</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-600 w-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-white/10">
              <div className="flex items-center gap-4 text-slate-400 text-xs">
                <div className="flex items-center gap-1"><Maximize size={14} /> Fullscreen (F)</div>
                <div className="flex items-center gap-1"><X size={14} /> Close (Esc)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none">
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} 
          />
        ))}
      </div>

      {/* Bottom Navigation */}
      {!isPlayerOpen && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-white/5 px-6 py-4 flex items-center justify-between md:hidden">
          <button className="w-12 h-12 flex items-center justify-center rounded-xl nav-item-active">
            <Home size={24} />
          </button>
          <button className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
            <Heart size={24} />
          </button>
          <button className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
            <LayoutGrid size={24} />
          </button>
          <button className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
            <LayoutGrid size={24} className="rotate-90" />
          </button>
          <button className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
            <Search size={24} />
          </button>
          <button className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
            <User size={24} />
          </button>
        </nav>
      )}
    </div>
  );
}
