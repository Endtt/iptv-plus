import { useState, useEffect } from "react";

const channels = [
  { id: 1, name: "TRT 1", category: "Ulusal", logo: "📺", color: "#E63946", live: true, viewers: "2.4M", program: "Ana Haber", nextProgram: "Belgesel" },
  { id: 2, name: "Show TV", category: "Ulusal", logo: "🎬", color: "#F4A261", live: true, viewers: "1.8M", program: "Dizi Kuşağı", nextProgram: "Film" },
  { id: 3, name: "Kanal D", category: "Ulusal", logo: "📡", color: "#2A9D8F", live: true, viewers: "1.2M", program: "Magazin", nextProgram: "Haber" },
  { id: 4, name: "CNN Türk", category: "Haber", logo: "📰", color: "#E9C46A", live: true, viewers: "980K", program: "Canlı Yayın", nextProgram: "Analiz" },
  { id: 5, name: "NTV", category: "Haber", logo: "🔴", color: "#264653", live: true, viewers: "760K", program: "Haber Bülteni", nextProgram: "Ekonomi" },
  { id: 6, name: "beIN Sports", category: "Spor", logo: "⚽", color: "#6A0572", live: true, viewers: "3.1M", program: "Süper Lig", nextProgram: "La Liga" },
  { id: 7, name: "Tivibu Spor", category: "Spor", logo: "🏆", color: "#1B4332", live: true, viewers: "540K", program: "Basketbol", nextProgram: "Voleybol" },
  { id: 8, name: "Cartoon Network", category: "Çocuk", logo: "🎨", color: "#FF6B6B", live: true, viewers: "420K", program: "Tom ve Jerry", nextProgram: "SpongeBob" },
  { id: 9, name: "Disney Channel", category: "Çocuk", logo: "✨", color: "#4CC9F0", live: true, viewers: "380K", program: "Miraculous", nextProgram: "Big City" },
  { id: 10, name: "National Geo", category: "Belgesel", logo: "🌍", color: "#F77F00", live: true, viewers: "290K", program: "Yaban Hayatı", nextProgram: "Uzay" },
  { id: 11, name: "Discovery", category: "Belgesel", logo: "🔬", color: "#3D405B", live: true, viewers: "210K", program: "Mythbusters", nextProgram: "Tarih" },
  { id: 12, name: "MTV", category: "Müzik", logo: "🎵", color: "#7209B7", live: true, viewers: "170K", program: "Top 40", nextProgram: "Canlı Konser" },
];

const movies = [
  { id: 1, title: "Kurtlar Vadisi", year: 2023, rating: 8.2, genre: "Aksiyon", duration: "2s 18dk", thumb: "🎬", color: "#1a1a2e", size: "4.2 GB", quality: "4K" },
  { id: 2, title: "Bir Başkadır", year: 2023, rating: 9.1, genre: "Dram", duration: "1s 52dk", thumb: "🎭", color: "#16213e", size: "2.8 GB", quality: "1080p" },
  { id: 3, title: "Çukur", year: 2022, rating: 8.7, genre: "Suç", duration: "2s 05dk", thumb: "🌑", color: "#0f3460", size: "3.5 GB", quality: "1080p" },
  { id: 4, title: "Diriliş Ertuğrul", year: 2023, rating: 7.9, genre: "Tarihi", duration: "2s 30dk", thumb: "⚔️", color: "#533483", size: "5.1 GB", quality: "4K" },
  { id: 5, title: "Barbaros Hayreddin", year: 2023, rating: 8.3, genre: "Macera", duration: "1s 45dk", thumb: "🏴‍☠️", color: "#2d132c", size: "3.9 GB", quality: "1080p" },
  { id: 6, title: "Yargı", year: 2023, rating: 8.5, genre: "Gerilim", duration: "2s 10dk", thumb: "⚖️", color: "#1b1b2f", size: "4.7 GB", quality: "4K" },
  { id: 7, title: "Fatih Harbiye", year: 2023, rating: 7.6, genre: "Romantik", duration: "1s 38dk", thumb: "🌹", color: "#200122", size: "2.4 GB", quality: "720p" },
  { id: 8, title: "Içerde", year: 2022, rating: 8.4, genre: "Aksiyon", duration: "2s 22dk", thumb: "🔫", color: "#0d0d0d", size: "4.0 GB", quality: "1080p" },
];

const epgData = [
  { time: "08:00", title: "Sabah Haberleri", duration: 60, category: "Haber" },
  { time: "09:00", title: "Belgesel: Doğa", duration: 90, category: "Belgesel" },
  { time: "10:30", title: "Dizi: Çukur", duration: 120, category: "Dizi" },
  { time: "12:30", title: "Öğle Haberleri", duration: 30, category: "Haber" },
  { time: "13:00", title: "Film: Aksiyon", duration: 150, category: "Film" },
  { time: "15:30", title: "Çocuk Programı", duration: 90, category: "Çocuk" },
  { time: "17:00", title: "Ana Haber", duration: 60, category: "Haber" },
  { time: "18:00", title: "Prime Time Dizi", duration: 120, category: "Dizi" },
  { time: "20:00", title: "Gece Haberleri", duration: 30, category: "Haber" },
  { time: "20:30", title: "Gece Filmi", duration: 120, category: "Film" },
];

const categories = ["Tümü", "Ulusal", "Haber", "Spor", "Çocuk", "Belgesel", "Müzik"];

export default function App() {
  const [activeTab, setActiveTab] = useState("live");
  const [selectedChannel, setSelectedChannel] = useState(channels[0]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [activeCategory, setActiveCategory] = useState("Tümü");
  const [favorites, setFavorites] = useState([1, 6]);
  const [search, setSearch] = useState("");
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(75);
  const [showEPG, setShowEPG] = useState(false);
  const [progress, setProgress] = useState(42);
  const [time, setTime] = useState(new Date());
  const [notification, setNotification] = useState(null);
  const [downloads, setDownloads] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [activeDownloadTab, setActiveDownloadTab] = useState("vod");
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const prog = setInterval(() => setProgress(p => p >= 100 ? 0 : p + 0.04), 100);
      return () => clearInterval(prog);
    }
  }, [isPlaying]);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });
    window.addEventListener('appinstalled', () => setIsInstalled(true));
  }, []);

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2800);
  };

  const toggleFavorite = (id) => {
    setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
    showNotif(favorites.includes(id) ? "Favorilerden çıkarıldı" : "Favorilere eklendi ⭐");
  };

  const startDownload = (movie) => {
    if (downloads.find(d => d.id === movie.id)) {
      showNotif("Bu film zaten indirildi ✅");
      return;
    }
    showNotif(`⬇️ İndirme başladı: ${movie.title}`);
    setDownloadProgress(prev => ({ ...prev, [movie.id]: 0 }));

    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        const current = prev[movie.id] || 0;
        if (current >= 100) {
          clearInterval(interval);
          setDownloads(d => [...d, { ...movie, downloadedAt: new Date() }]);
          setDownloadProgress(p => { const n = { ...p }; delete n[movie.id]; return n; });
          showNotif(`✅ ${movie.title} indirildi!`);
          return prev;
        }
        return { ...prev, [movie.id]: current + Math.random() * 8 };
      });
    }, 300);
  };

  const removeDownload = (id) => {
    setDownloads(d => d.filter(x => x.id !== id));
    showNotif("🗑️ İndirme silindi");
  };

  const filtered = channels.filter(c =>
    (activeCategory === "Tümü" || c.category === activeCategory) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const favChannels = channels.filter(c => favorites.includes(c.id));
  const currentHour = time.getHours();
  const isMobile = window.innerWidth <= 430;

  const containerStyle = {
    width: isMobile ? "100vw" : "390px",
    height: isMobile ? "100dvh" : "844px",
    margin: "0 auto",
    background: "#080810",
    color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    borderRadius: isMobile ? "0" : "40px",
    overflow: "hidden",
    position: "relative",
    boxShadow: isMobile ? "none" : "0 40px 100px rgba(0,0,0,0.8)",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={containerStyle}>
      {/* Status Bar */}
      <div style={{
        padding: isMobile ? "env(safe-area-inset-top, 14px) 28px 0" : "14px 28px 0",
        paddingTop: isMobile ? "max(env(safe-area-inset-top), 14px)" : "14px",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0
      }}>
        <span style={{ fontSize: "15px", fontWeight: 600 }}>
          {time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
        </span>
        {!isMobile && <div style={{ width: "120px", height: "30px", background: "#000", borderRadius: "20px" }} />}
        <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "13px" }}>
          <span>📶</span><span>🔋</span>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: "10px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "-0.5px" }}>
            <span style={{ background: "linear-gradient(135deg, #fff 0%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>IPTV</span>
            <span style={{ color: "#7c3aed" }}>+</span>
          </div>
          <div style={{ fontSize: "10px", color: "#444", marginTop: "1px", letterSpacing: "0.5px" }}>PREMIUM TV DENEYİMİ</div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {downloads.length > 0 && (
            <div style={{
              background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)",
              borderRadius: "10px", padding: "5px 10px", fontSize: "11px", color: "#a78bfa",
              display: "flex", alignItems: "center", gap: "4px"
            }}>
              ⬇️ {downloads.length}
            </div>
          )}
          <div style={{
            background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: "10px", padding: "5px 10px", fontSize: "11px", color: "#22c55e",
            display: "flex", alignItems: "center", gap: "4px"
          }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e" }} />
            CANLI
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* ── LIVE TV ── */}
        {activeTab === "live" && (
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {/* Player */}
            <div style={{
              margin: "0 14px 10px", borderRadius: "18px", overflow: "hidden",
              background: `linear-gradient(135deg, ${selectedChannel.color}25, #0d0d18)`,
              border: "1px solid rgba(255,255,255,0.06)", position: "relative", flexShrink: 0
            }}>
              <div style={{
                height: "170px", display: "flex", alignItems: "center", justifyContent: "center",
                background: `radial-gradient(ellipse at 50% 60%, ${selectedChannel.color}18 0%, transparent 65%)`,
                position: "relative"
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "48px", marginBottom: "6px" }}>{selectedChannel.logo}</div>
                  <div style={{ fontSize: "14px", fontWeight: 800 }}>{selectedChannel.name}</div>
                  <div style={{ fontSize: "11px", color: "#777", marginTop: "2px" }}>{selectedChannel.program}</div>
                </div>
                <div style={{
                  position: "absolute", top: "10px", left: "10px",
                  background: "#dc2626", borderRadius: "7px", padding: "3px 8px",
                  fontSize: "10px", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px"
                }}>
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#fff", animation: "pulse 1s infinite" }} />
                  CANLI
                </div>
                <div style={{
                  position: "absolute", top: "10px", right: "10px",
                  background: "rgba(0,0,0,0.55)", borderRadius: "7px", padding: "3px 8px",
                  fontSize: "10px", color: "#bbb"
                }}>👁 {selectedChannel.viewers}</div>
              </div>

              <div style={{ padding: "8px 12px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700 }}>{selectedChannel.program}</div>
                    <div style={{ fontSize: "10px", color: "#555" }}>Sonraki: {selectedChannel.nextProgram}</div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <Btn active={favorites.includes(selectedChannel.id)} color="#EAB308" onClick={() => toggleFavorite(selectedChannel.id)}>★</Btn>
                    <Btn active={showEPG} color="#a78bfa" onClick={() => setShowEPG(!showEPG)}>📅</Btn>
                  </div>
                </div>
                <div style={{ height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden", marginBottom: "8px" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #7c3aed, #a78bfa)", transition: "width 0.1s" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CtrlBtn onClick={() => { const i = channels.findIndex(c => c.id === selectedChannel.id); setSelectedChannel(channels[(i - 1 + channels.length) % channels.length]); }}>⏮</CtrlBtn>
                  <PlayBtn playing={isPlaying} onClick={() => setIsPlaying(!isPlaying)} />
                  <CtrlBtn onClick={() => { const i = channels.findIndex(c => c.id === selectedChannel.id); setSelectedChannel(channels[(i + 1) % channels.length]); }}>⏭</CtrlBtn>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ fontSize: "11px" }}>🔊</span>
                    <input type="range" min="0" max="100" value={volume} onChange={e => setVolume(e.target.value)}
                      style={{ flex: 1, accentColor: "#7c3aed", height: "3px" }} />
                  </div>
                </div>
              </div>

              {showEPG && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(8,8,16,0.97)", borderRadius: "18px", padding: "12px", overflowY: "auto", zIndex: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>📅 Program Rehberi — {selectedChannel.name}</div>
                    <button onClick={() => setShowEPG(false)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "20px", lineHeight: 1 }}>×</button>
                  </div>
                  {epgData.map((prog, i) => {
                    const h = parseInt(prog.time.split(":")[0]);
                    const isCurrent = h <= currentHour && currentHour < h + Math.floor(prog.duration / 60);
                    return (
                      <div key={i} style={{
                        display: "flex", gap: "10px", padding: "7px 9px", borderRadius: "9px", marginBottom: "3px",
                        background: isCurrent ? "rgba(124,58,237,0.22)" : "rgba(255,255,255,0.03)",
                        border: isCurrent ? "1px solid rgba(124,58,237,0.4)" : "1px solid transparent"
                      }}>
                        <div style={{ fontSize: "11px", color: isCurrent ? "#a78bfa" : "#444", width: "36px", fontWeight: isCurrent ? 700 : 400 }}>{prog.time}</div>
                        <div style={{ flex: 1, fontSize: "12px", color: isCurrent ? "#fff" : "#777" }}>{prog.title}</div>
                        <div style={{ fontSize: "10px", color: "#444" }}>{prog.duration}dk</div>
                        {isCurrent && <div style={{ fontSize: "9px", background: "#7c3aed", borderRadius: "5px", padding: "2px 5px", alignSelf: "center" }}>ŞİMDİ</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Search + Filter */}
            <div style={{ padding: "0 14px 7px", flexShrink: 0 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "rgba(255,255,255,0.05)", borderRadius: "11px", padding: "7px 11px",
                border: "1px solid rgba(255,255,255,0.06)", marginBottom: "8px"
              }}>
                <span style={{ color: "#444", fontSize: "13px" }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kanal ara..."
                  style={{ background: "none", border: "none", color: "#fff", fontSize: "13px", flex: 1, outline: "none" }} />
                {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "16px" }}>×</button>}
              </div>
              <div style={{ display: "flex", gap: "5px", overflowX: "auto" }}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                    flexShrink: 0, padding: "4px 10px", borderRadius: "18px", border: "none",
                    background: activeCategory === cat ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.06)",
                    color: activeCategory === cat ? "#fff" : "#555", fontSize: "10px", fontWeight: 600, cursor: "pointer"
                  }}>{cat}</button>
                ))}
              </div>
            </div>

            {/* Channel List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 14px" }}>
              {filtered.map(ch => (
                <div key={ch.id} onClick={() => setSelectedChannel(ch)} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "9px 11px", borderRadius: "12px", marginBottom: "5px",
                  background: selectedChannel.id === ch.id ? `linear-gradient(135deg,${ch.color}20,rgba(124,58,237,0.08))` : "rgba(255,255,255,0.025)",
                  border: selectedChannel.id === ch.id ? `1px solid ${ch.color}35` : "1px solid rgba(255,255,255,0.035)",
                  cursor: "pointer"
                }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: `${ch.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "19px", flexShrink: 0 }}>{ch.logo}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: selectedChannel.id === ch.id ? "#fff" : "#ccc" }}>{ch.name}</div>
                      <div style={{ fontSize: "9px", color: "#444" }}>👁 {ch.viewers}</div>
                    </div>
                    <div style={{ fontSize: "10px", color: "#555", marginTop: "1px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{ch.program}</div>
                  </div>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0 }}>
                    {favorites.includes(ch.id) && <span style={{ color: "#EAB308", fontSize: "11px" }}>★</span>}
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VOD ── */}
        {activeTab === "vod" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "4px 14px 10px", display: "flex", gap: "8px", flexShrink: 0 }}>
              {["vod", "downloads"].map(t => (
                <button key={t} onClick={() => setActiveDownloadTab(t)} style={{
                  padding: "6px 16px", borderRadius: "18px", border: "none",
                  background: activeDownloadTab === t ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.07)",
                  color: activeDownloadTab === t ? "#fff" : "#555", fontSize: "12px", fontWeight: 600, cursor: "pointer"
                }}>
                  {t === "vod" ? "🎬 Film & Dizi" : `⬇️ İndirilenler (${downloads.length})`}
                </button>
              ))}
            </div>

            {activeDownloadTab === "vod" ? (
              <div style={{ flex: 1, overflowY: "auto", padding: "0 14px" }}>
                {selectedMovie && (
                  <MovieDetail movie={selectedMovie} onDownload={startDownload} downloadProgress={downloadProgress} downloads={downloads} />
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px" }}>
                  {movies.map(m => {
                    const dl = downloads.find(d => d.id === m.id);
                    const dlProg = downloadProgress[m.id];
                    return (
                      <div key={m.id} onClick={() => setSelectedMovie(m)} style={{
                        borderRadius: "13px", overflow: "hidden", cursor: "pointer",
                        background: `linear-gradient(160deg,${m.color},#0c0c18)`,
                        border: selectedMovie?.id === m.id ? "1px solid rgba(124,58,237,0.5)" : "1px solid rgba(255,255,255,0.04)"
                      }}>
                        <div style={{ height: "95px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", position: "relative" }}>
                          {m.thumb}
                          <div style={{
                            position: "absolute", top: "6px", right: "6px",
                            background: dl ? "rgba(34,197,94,0.85)" : "rgba(0,0,0,0.6)",
                            borderRadius: "6px", padding: "2px 5px", fontSize: "9px",
                            color: dl ? "#fff" : "#aaa", fontWeight: 700
                          }}>{m.quality}</div>
                        </div>
                        <div style={{ padding: "7px 9px 9px" }}>
                          <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "3px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{m.title}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "10px", color: "#a78bfa" }}>{m.genre}</span>
                            <span style={{ fontSize: "10px", color: "#EAB308" }}>★ {m.rating}</span>
                          </div>
                          {dlProg !== undefined && (
                            <div style={{ marginTop: "5px", height: "3px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${Math.min(dlProg, 100)}%`, background: "linear-gradient(90deg,#7c3aed,#a78bfa)", transition: "width 0.3s" }} />
                            </div>
                          )}
                          {dl && <div style={{ marginTop: "4px", fontSize: "9px", color: "#22c55e" }}>✅ İndirildi</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: "auto", padding: "0 14px" }}>
                {downloads.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "50px 20px", color: "#333" }}>
                    <div style={{ fontSize: "50px", marginBottom: "12px" }}>⬇️</div>
                    <div style={{ fontSize: "14px", color: "#555" }}>Henüz indirilen içerik yok</div>
                    <div style={{ fontSize: "11px", color: "#333", marginTop: "6px" }}>Film & Dizi bölümünden indirin</div>
                  </div>
                ) : downloads.map(m => (
                  <div key={m.id} style={{
                    display: "flex", gap: "12px", alignItems: "center",
                    padding: "10px 12px", borderRadius: "13px", marginBottom: "7px",
                    background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)"
                  }}>
                    <div style={{ width: "44px", height: "60px", borderRadius: "9px", background: `${m.color}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{m.thumb}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700 }}>{m.title}</div>
                      <div style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>{m.quality} · {m.size}</div>
                      <div style={{ fontSize: "10px", color: "#22c55e", marginTop: "3px" }}>✅ Çevrimdışı İzlenebilir</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <button style={{
                        background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none",
                        borderRadius: "8px", padding: "6px 10px", color: "#fff", fontSize: "11px", cursor: "pointer"
                      }}>▶</button>
                      <button onClick={() => removeDownload(m.id)} style={{
                        background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: "8px", padding: "5px 8px", color: "#ef4444", fontSize: "11px", cursor: "pointer"
                      }}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FAVORITES ── */}
        {activeTab === "favorites" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "0 14px" }}>
            <div style={{ fontSize: "15px", fontWeight: 800, margin: "4px 0 12px" }}>⭐ Favori Kanallar</div>
            {favChannels.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px", color: "#333" }}>
                <div style={{ fontSize: "50px", marginBottom: "12px" }}>⭐</div>
                <div style={{ fontSize: "14px", color: "#555" }}>Henüz favori eklemediniz</div>
              </div>
            ) : favChannels.map(ch => (
              <div key={ch.id} onClick={() => { setSelectedChannel(ch); setActiveTab("live"); }} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "11px 12px", borderRadius: "13px", marginBottom: "7px",
                background: `linear-gradient(135deg,${ch.color}12,rgba(255,255,255,0.025))`,
                border: `1px solid ${ch.color}22`, cursor: "pointer"
              }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "13px", background: `${ch.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>{ch.logo}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>{ch.name}</div>
                  <div style={{ fontSize: "10px", color: "#555", marginTop: "2px" }}>{ch.program}</div>
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
                  <button onClick={e => { e.stopPropagation(); toggleFavorite(ch.id); }} style={{ background: "none", border: "none", color: "#EAB308", cursor: "pointer", fontSize: "17px" }}>★</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── EPG ── */}
        {activeTab === "epg" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "0 14px" }}>
            <div style={{ fontSize: "15px", fontWeight: 800, margin: "4px 0 4px" }}>📅 Program Rehberi</div>
            <div style={{ fontSize: "11px", color: "#444", marginBottom: "12px" }}>
              {time.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })} · {time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </div>
            {channels.slice(0, 5).map(ch => (
              <div key={ch.id} style={{ marginBottom: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "7px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: `${ch.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>{ch.logo}</div>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#ccc" }}>{ch.name}</span>
                </div>
                <div style={{ display: "flex", gap: "7px", overflowX: "auto", paddingBottom: "4px" }}>
                  {epgData.slice(0, 6).map((prog, i) => {
                    const h = parseInt(prog.time.split(":")[0]);
                    const isCurrent = h <= currentHour && currentHour < h + 1;
                    return (
                      <div key={i} style={{
                        flexShrink: 0, minWidth: "90px", padding: "7px 9px", borderRadius: "9px",
                        background: isCurrent ? "rgba(124,58,237,0.22)" : "rgba(255,255,255,0.04)",
                        border: isCurrent ? "1px solid rgba(124,58,237,0.45)" : "1px solid rgba(255,255,255,0.04)"
                      }}>
                        <div style={{ fontSize: "10px", color: isCurrent ? "#a78bfa" : "#444", marginBottom: "2px" }}>{prog.time}</div>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: isCurrent ? "#fff" : "#777" }}>{prog.title}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={{
        padding: "8px 16px",
        paddingBottom: `max(env(safe-area-inset-bottom, 8px), 22px)`,
        display: "flex", justifyContent: "space-around",
        background: "rgba(8,8,16,0.95)", borderTop: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0
      }}>
        {[
          { id: "live", icon: "📺", label: "Canlı" },
          { id: "vod", icon: "🎬", label: "Film" },
          { id: "favorites", icon: "⭐", label: "Favori" },
          { id: "epg", icon: "📅", label: "Rehber" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
            color: activeTab === tab.id ? "#a78bfa" : "#3a3a4a", padding: "0"
          }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: "11px",
              background: activeTab === tab.id ? "rgba(124,58,237,0.18)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px"
            }}>{tab.icon}</div>
            <span style={{ fontSize: "9px", fontWeight: activeTab === tab.id ? 700 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Toast */}
      {notification && (
        <div style={{
          position: "absolute", bottom: "90px", left: "50%", transform: "translateX(-50%)",
          background: "rgba(15,15,25,0.95)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(124,58,237,0.3)", borderRadius: "12px",
          padding: "9px 16px", fontSize: "12px", fontWeight: 600,
          whiteSpace: "nowrap", zIndex: 100
        }}>{notification}</div>
      )}

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        input[type=range]{-webkit-appearance:none;background:rgba(255,255,255,0.1);border-radius:2px;height:3px;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#7c3aed;cursor:pointer;}
        ::-webkit-scrollbar{display:none;}
        *{-webkit-tap-highlight-color:transparent;}
      `}</style>
    </div>
  );
}

function Btn({ children, onClick, active, color }) {
  return (
    <button onClick={onClick} style={{
      width: "28px", height: "28px", borderRadius: "9px", border: "none",
      background: active ? `${color}22` : "rgba(255,255,255,0.06)",
      color: active ? color : "#555", cursor: "pointer", fontSize: "13px"
    }}>{children}</button>
  );
}

function CtrlBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", color: "#999", fontSize: "16px", cursor: "pointer", padding: "0 2px" }}>{children}</button>
  );
}

function PlayBtn({ playing, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: "36px", height: "36px", borderRadius: "11px", border: "none",
      background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff",
      fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
    }}>{playing ? "⏸" : "▶"}</button>
  );
}

function MovieDetail({ movie, onDownload, downloadProgress, downloads }) {
  const dlProg = downloadProgress[movie.id];
  const isDownloaded = downloads.find(d => d.id === movie.id);
  const isDownloading = dlProg !== undefined;

  return (
    <div style={{
      borderRadius: "16px", overflow: "hidden",
      background: `linear-gradient(135deg,${movie.color},#0c0c18)`,
      border: "1px solid rgba(255,255,255,0.07)", marginBottom: "12px", padding: "14px"
    }}>
      <div style={{ display: "flex", gap: "12px" }}>
        <div style={{
          width: "76px", height: "105px", borderRadius: "11px",
          background: "rgba(255,255,255,0.06)", display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: "38px", flexShrink: 0
        }}>{movie.thumb}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "5px" }}>{movie.title}</div>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "6px" }}>
            {[movie.year, movie.genre, movie.quality, movie.duration].map((tag, i) => (
              <span key={i} style={{
                fontSize: "10px", borderRadius: "6px", padding: "2px 7px",
                background: i === 2 ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)",
                color: i === 2 ? "#22c55e" : "#888"
              }}>{tag}</span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "10px" }}>
            <span style={{ color: "#EAB308", fontSize: "13px" }}>★</span>
            <span style={{ fontSize: "13px", fontWeight: 700 }}>{movie.rating}</span>
            <span style={{ fontSize: "10px", color: "#444" }}>/10</span>
            <span style={{ fontSize: "10px", color: "#555", marginLeft: "6px" }}>💾 {movie.size}</span>
          </div>
          <div style={{ display: "flex", gap: "7px" }}>
            <button style={{
              background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none",
              borderRadius: "9px", padding: "7px 14px", color: "#fff", fontSize: "11px",
              fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px"
            }}>▶ İzle</button>
            <button onClick={() => !isDownloaded && !isDownloading && onDownload(movie)} style={{
              background: isDownloaded ? "rgba(34,197,94,0.15)" : isDownloading ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.07)",
              border: isDownloaded ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: "9px", padding: "7px 12px", color: isDownloaded ? "#22c55e" : isDownloading ? "#a78bfa" : "#888",
              fontSize: "11px", fontWeight: 700, cursor: isDownloaded || isDownloading ? "default" : "pointer",
              display: "flex", alignItems: "center", gap: "4px"
            }}>
              {isDownloaded ? "✅ İndirildi" : isDownloading ? `⬇️ %${Math.floor(dlProg)}` : "⬇️ İndir"}
            </button>
          </div>
        </div>
      </div>
      {isDownloading && (
        <div style={{ marginTop: "10px", height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(dlProg, 100)}%`, background: "linear-gradient(90deg,#7c3aed,#22c55e)", transition: "width 0.3s" }} />
        </div>
      )}
    </div>
  );
}
