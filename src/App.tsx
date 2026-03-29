import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Search, 
  Upload, 
  Heart, 
  History, 
  Filter, 
  X, 
  Maximize, 
  Volume2, 
  VolumeX,
  ChevronRight,
  Tv,
  Info,
  Link as LinkIcon,
  Trash2,
  Star,
  Plus
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
    if (currentChannel && videoRef.current) {
      const video = videoRef.current;
      const streamUrl = currentChannel.url;

      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
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
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                addToast("Stream error. Try another channel.", "error");
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari support
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => {
          video.play();
        });
      }
    }
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
      addToast("Failed to load from URL. Check CORS or link validity.", "error");
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
      <header className="sticky top-0 z-50 glass border-b border-white/10 px-4 py-3 md:px-8 flex flex-col gap-3 md:gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/30">
              <Tv className="text-white" size={18} />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tighter text-white">Smile<span className="text-orange-500">TV</span></h1>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            <button 
              onClick={() => {
                setUrlInput('https://iptv-org.github.io/iptv/index.m3u');
                setShowUrlInput(true);
              }}
              className="btn-secondary !p-2 md:!px-4"
              title="Load iptv-org Playlist"
            >
              <Star size={18} className="text-orange-500" />
              <span className="hidden lg:inline">iptv-org</span>
            </button>
            <button 
              onClick={() => setShowAddChannel(true)}
              className="btn-secondary !p-2 md:!px-4"
              title="Add Channel Manually"
            >
              <Plus size={18} />
              <span className="hidden lg:inline">Add</span>
            </button>
            <button 
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="btn-secondary !p-2 md:!px-4"
              title="Load from URL"
            >
              <LinkIcon size={18} />
              <span className="hidden lg:inline">URL</span>
            </button>
            <label className="btn-primary cursor-pointer !p-2 md:!px-4">
              <Upload size={18} />
              <span className="hidden lg:inline">Upload</span>
              <input type="file" accept=".m3u" onChange={handleFileUpload} className="hidden" />
            </label>
            {playlist && (
              <button onClick={clearPlaylist} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        {showUrlInput && (
          <div className="flex gap-2 animate-fade-in">
            <input 
              type="text" 
              placeholder="Paste M3U URL here..." 
              className="glass-input flex-1"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <button onClick={handleUrlLoad} className="btn-primary">Load</button>
          </div>
        )}

        {/* Search & Categories */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search channels..." 
              className="glass-input w-full pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl whitespace-nowrap transition-all font-medium border",
                  selectedCategory === cat 
                    ? "bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-600/20" 
                    : "glass border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredChannels.map(ch => (
            <div 
              key={ch.id}
              onClick={() => playChannel(ch)}
              className="glass-card group cursor-pointer relative flex flex-col"
            >
              <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-orange-500 border border-white/10">
                #{ch.number}
              </div>
              <button 
                onClick={(e) => toggleFavorite(ch.id, e)}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-lg glass hover:bg-white/20 transition-all"
              >
                <Heart 
                  size={16} 
                  className={cn(favorites.includes(ch.id) ? "fill-red-500 text-red-500" : "text-white")} 
                />
              </button>
              
              <div className="aspect-video relative overflow-hidden rounded-t-2xl">
                <img 
                  src={ch.logo} 
                  alt={ch.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <Play className="text-white fill-white" size={32} />
                </div>
              </div>
              
              <div className="p-3">
                <h3 className="font-bold text-sm truncate mb-1 group-hover:text-orange-500 transition-colors">{ch.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold truncate max-w-[80%]">{ch.category}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
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
        <form onSubmit={handleAddManualChannel} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Channel Name</label>
            <input 
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
              type="text" 
              placeholder="e.g. News, Sports" 
              className="glass-input w-full"
              value={newChannel.category}
              onChange={(e) => setNewChannel({...newChannel, category: e.target.value})}
            />
          </div>
          <button type="submit" className="btn-primary w-full justify-center mt-4">
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

      {/* Mobile Navigation (Floating) */}
      {!isPlayerOpen && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 glass rounded-2xl border border-white/10 p-2 flex items-center gap-2 shadow-2xl z-40">
          <button 
            onClick={() => setSelectedCategory('All')}
            className={cn("p-3 rounded-xl transition-all", selectedCategory === 'All' ? "bg-orange-600 text-white" : "hover:bg-white/10 text-slate-400")}
          >
            <Tv size={20} />
          </button>
          <button 
            onClick={() => setSelectedCategory('Favorites')}
            className={cn("p-3 rounded-xl transition-all", selectedCategory === 'Favorites' ? "bg-orange-600 text-white" : "hover:bg-white/10 text-slate-400")}
          >
            <Heart size={20} />
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-3 rounded-xl hover:bg-white/10 text-slate-400 transition-all"
          >
            <ChevronRight size={20} className="-rotate-90" />
          </button>
        </nav>
      )}
    </div>
  );
}
