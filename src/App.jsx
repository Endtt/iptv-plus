import { useState, useEffect, useRef, useMemo, useCallback } from "react";

// ─── M3U CHUNK PARSER — 100K+ kanal için, UI donmuyor ────────────────────────
const COLORS = ["#E63946","#F4A261","#2A9D8F","#E9C46A","#264653","#6A0572","#1B4332","#FF6B6B","#4CC9F0","#F77F00","#3D405B","#7209B7","#D62828","#023E8A","#2D6A4F"];

function categoryEmoji(cat) {
  const c = (cat || "").toLowerCase();
  if (c.includes("haber") || c.includes("news")) return "📰";
  if (c.includes("spor") || c.includes("sport")) return "⚽";
  if (c.includes("çocuk") || c.includes("kids") || c.includes("cartoon")) return "🎨";
  if (c.includes("müzik") || c.includes("music")) return "🎵";
  if (c.includes("belgesel") || c.includes("doc")) return "🌍";
  if (c.includes("film") || c.includes("movie")) return "🎬";
  if (c.includes("dizi") || c.includes("series")) return "📺";
  return "📡";
}

// Async chunked parser — her 5000 satırda bir UI'ye nefes aldırır
function parseM3UAsync(text, onProgress) {
  return new Promise((resolve) => {
    const lines = text.split("\n");
    const channels = [];
    let current = null;
    let i = 0;
    const CHUNK = 5000;

    function next() {
      const end = Math.min(i + CHUNK, lines.length);
      for (; i < end; i++) {
        const line = lines[i].trim();
        if (!line || line === "#EXTM3U") continue;
        if (line.startsWith("#EXTINF")) {
          current = {};
          const nm = line.match(/,(.+)$/); current.name = nm ? nm[1].trim() : "Kanal";
          const lg = line.match(/tvg-logo="([^"]+)"/); current.logo = lg ? lg[1] : null;
          const gr = line.match(/group-title="([^"]+)"/); current.category = gr ? gr[1].trim() : "Genel";
          current.emoji = categoryEmoji(current.category);
        } else if (!line.startsWith("#")) {
          if (current && (line.startsWith("http") || line.startsWith("rtmp") || line.startsWith("rtsp"))) {
            current.url = line;
            current.id = channels.length + 1;
            current.live = true;
            current.color = COLORS[channels.length % COLORS.length];
            channels.push(current);
          }
          current = null;
        }
      }
      if (onProgress) onProgress(Math.min(99, Math.round((i / lines.length) * 100)), channels.length);
      if (i < lines.length) setTimeout(next, 0);
      else resolve(channels);
    }
    next();
  });
}

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO = [
  { id:1, name:"TRT 1", category:"Ulusal", emoji:"📺", color:"#E63946", url:"", logo:null },
  { id:2, name:"Show TV", category:"Ulusal", emoji:"🎬", color:"#F4A261", url:"", logo:null },
  { id:3, name:"Kanal D", category:"Ulusal", emoji:"📡", color:"#2A9D8F", url:"", logo:null },
  { id:4, name:"CNN Türk", category:"Haber", emoji:"📰", color:"#E9C46A", url:"", logo:null },
  { id:5, name:"NTV", category:"Haber", emoji:"📰", color:"#264653", url:"", logo:null },
  { id:6, name:"beIN Sports", category:"Spor", emoji:"⚽", color:"#6A0572", url:"", logo:null },
  { id:7, name:"TRT Spor", category:"Spor", emoji:"🏆", color:"#1B4332", url:"", logo:null },
  { id:8, name:"Cartoon Network", category:"Çocuk", emoji:"🎨", color:"#FF6B6B", url:"", logo:null },
];

// ─── STORAGE — sadece source bilgisini sakla, 100K kanal localStorage'a sığmaz
const SRC_KEY = "iptv_source_v3";
function saveSource(src) { try { localStorage.setItem(SRC_KEY, JSON.stringify(src)); } catch(e){} }
function loadSource() { try { const r = localStorage.getItem(SRC_KEY); return r ? JSON.parse(r) : null; } catch(e){ return null; } }

// ─── VIRTUAL LIST — sadece görünen öğeleri render eder ──────────────────────
const ITEM_H = 54; // her kanal satırının yüksekliği (px)
const VISIBLE_EXTRA = 5; // ekranda görünen + buffer

function VirtualList({ items, renderItem, containerHeight = 300 }) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const totalHeight = items.length * ITEM_H;
  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_H) - VISIBLE_EXTRA);
  const visibleCount = Math.ceil(containerHeight / ITEM_H) + VISIBLE_EXTRA * 2;
  const endIdx = Math.min(items.length, startIdx + visibleCount);
  const visibleItems = items.slice(startIdx, endIdx);
  const offsetY = startIdx * ITEM_H;

  return (
    <div ref={containerRef} style={{ flex:1, overflowY:"auto", padding:"0 14px" }}
      onScroll={e => setScrollTop(e.currentTarget.scrollTop)}>
      <div style={{ height: totalHeight, position:"relative" }}>
        <div style={{ position:"absolute", top: offsetY, left:0, right:0 }}>
          {visibleItems.map((item, i) => renderItem(item, startIdx + i))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function IPTVApp() {
  const [channels, setChannels]       = useState(DEMO);
  const [m3uSource, setM3uSource]     = useState(loadSource);
  const [activeTab, setActiveTab]     = useState("live");
  const [selectedCh, setSelectedCh]  = useState(DEMO[0]);
  const [activeCategory, setCategory] = useState("Tümü");
  const [favorites, setFavorites]     = useState([]);
  const [search, setSearch]           = useState("");
  const [isPlaying, setIsPlaying]     = useState(true);
  const [volume, setVolume]           = useState(75);
  const [progress, setProgress]       = useState(28);
  const [time, setTime]               = useState(new Date());
  const [notif, setNotif]             = useState(null);
  const [showImport, setShowImport]   = useState(false);
  const [importTab, setImportTab]     = useState("file"); // dosya önerilsin
  const [m3uUrl, setM3uUrl]           = useState("");
  const [loading, setLoading]         = useState(false);
  const [loadProgress, setLoadProgress] = useState(0); // % 0-100
  const [loadCount, setLoadCount]     = useState(0);   // işlenen kanal sayısı
  const [loadErr, setLoadErr]         = useState("");
  const fileRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => setProgress(p => p >= 100 ? 0 : +(p+0.04).toFixed(2)), 100);
    return () => clearInterval(t);
  }, [isPlaying]);

  const toast = (msg) => { setNotif(msg); setTimeout(() => setNotif(null), 3000); };

  const categories = useMemo(() => {
    const cats = [...new Set(channels.map(c => c.category).filter(Boolean))].sort();
    return ["Tümü", ...cats];
  }, [channels]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return channels.filter(c =>
      (activeCategory === "Tümü" || c.category === activeCategory) &&
      (!q || c.name.toLowerCase().includes(q))
    );
  }, [channels, activeCategory, search]);

  const favChannels = useMemo(() => channels.filter(c => favorites.includes(c.id)), [channels, favorites]);

  const applyChannels = (chs, source) => {
    setChannels(chs);
    setM3uSource(source);
    setSelectedCh(chs[0]);
    setCategory("Tümü");
    saveSource(source);
    setShowImport(false);
    setLoadProgress(0);
    setLoadCount(0);
    toast(`✅ ${chs.length.toLocaleString()} kanal yüklendi!`);
  };

  // ── URL'den yükle ──
  const loadFromUrl = async () => {
    if (!m3uUrl.trim()) { setLoadErr("Lütfen bir URL girin."); return; }
    setLoading(true); setLoadErr(""); setLoadProgress(0);
    const url = m3uUrl.trim();
    const proxies = [
      u => u,
      u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    ];
    let text = null;
    for (const mk of proxies) {
      try {
        setLoadErr(`🔄 Bağlanıyor...`);
        const res = await fetch(mk(url), { signal: AbortSignal.timeout(15000) });
        if (!res.ok) continue;
        setLoadErr("📥 İndiriliyor...");
        const t = await res.text();
        if (t.includes("#EXTINF")) { text = t; break; }
      } catch(e) { continue; }
    }
    if (!text) {
      setLoadErr("❌ URL'ye ulaşılamadı. Lütfen dosyayı indirip 'Dosyadan Yükle' seçeneğini deneyin.");
      setLoading(false); return;
    }
    setLoadErr("⚙️ Kanallar işleniyor...");
    const chs = await parseM3UAsync(text, (pct, cnt) => {
      setLoadProgress(pct); setLoadCount(cnt);
    });
    if (!chs.length) { setLoadErr("❌ Hiç kanal bulunamadı."); setLoading(false); return; }
    applyChannels(chs, { type:"url", label: url });
    setLoading(false);
  };

  // ── Dosyadan yükle ──
  const loadFromFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true); setLoadErr("📥 Dosya okunuyor..."); setLoadProgress(0); setLoadCount(0);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target.result;
        if (!text.includes("#EXTINF")) throw new Error("Geçerli bir M3U dosyası değil.");
        setLoadErr("⚙️ Kanallar işleniyor...");
        const chs = await parseM3UAsync(text, (pct, cnt) => {
          setLoadProgress(pct); setLoadCount(cnt);
        });
        if (!chs.length) throw new Error("Hiç kanal bulunamadı.");
        applyChannels(chs, { type:"file", label: file.name });
      } catch(err) { setLoadErr("❌ " + err.message); }
      setLoading(false);
    };
    reader.onerror = () => { setLoadErr("❌ Dosya okunamadı."); setLoading(false); };
    reader.readAsText(file);
  };

  const toggleFav = (id) => {
    setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
    toast(favorites.includes(id) ? "Favorilerden çıkarıldı" : "Favorilere eklendi ⭐");
  };

  const Logo = ({ ch, size=38 }) => (
    <div style={{ width:size, height:size, borderRadius:size*0.27, background:`${ch.color}28`,
      display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0, position:"relative" }}>
      {ch.logo && <img src={ch.logo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute", top:0, left:0 }}
        onError={e => { e.target.style.display="none"; }} />}
      <span style={{ fontSize:size*0.44 }}>{ch.emoji||"📡"}</span>
    </div>
  );

  const ChannelRow = useCallback((ch) => (
    <div key={ch.id} onClick={() => setSelectedCh(ch)} style={{
      display:"flex", alignItems:"center", gap:"10px",
      padding:"8px 10px", borderRadius:"12px", marginBottom:"4px",
      height: ITEM_H - 4,
      background: selectedCh.id===ch.id ? `linear-gradient(135deg,${ch.color}18,rgba(124,58,237,0.07))` : "rgba(255,255,255,0.025)",
      border: selectedCh.id===ch.id ? `1px solid ${ch.color}30` : "1px solid rgba(255,255,255,0.03)",
      cursor:"pointer", boxSizing:"border-box" }}>
      <Logo ch={ch} size={38} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:"12px", fontWeight:700, color: selectedCh.id===ch.id?"#fff":"#ccc",
          overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{ch.name}</div>
        <div style={{ fontSize:"9px", color:"#3a3a4a", marginTop:"1px" }}>{ch.category}</div>
      </div>
      <div style={{ display:"flex", gap:"4px", alignItems:"center", flexShrink:0 }}>
        {favorites.includes(ch.id) && <span style={{ color:"#EAB308", fontSize:"10px" }}>★</span>}
        <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#22c55e" }} />
      </div>
    </div>
  ), [selectedCh, favorites]);

  return (
    <div style={{ width:"390px", height:"844px", margin:"0 auto", background:"#080810", color:"#fff",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      borderRadius:"40px", overflow:"hidden", position:"relative",
      boxShadow:"0 40px 100px rgba(0,0,0,0.8),inset 0 1px 0 rgba(255,255,255,0.1)",
      display:"flex", flexDirection:"column" }}>

      {/* Status */}
      <div style={{ padding:"14px 28px 0", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <span style={{ fontSize:"15px", fontWeight:600 }}>{time.toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}</span>
        <div style={{ width:"120px", height:"30px", background:"#000", borderRadius:"20px" }} />
        <div style={{ display:"flex", gap:"6px", fontSize:"13px" }}><span>📶</span><span>🔋</span></div>
      </div>

      {/* Header */}
      <div style={{ padding:"10px 20px 8px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div>
          <div style={{ fontSize:"22px", fontWeight:900 }}>
            <span style={{ background:"linear-gradient(135deg,#fff,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>IPTV</span>
            <span style={{ color:"#7c3aed" }}>+</span>
          </div>
          {m3uSource
            ? <div style={{ fontSize:"9px", color:"#a78bfa", marginTop:"1px" }}>
                {m3uSource.type==="url"?"🔗":"📁"} {(m3uSource.label||"").length>30?(m3uSource.label).slice(0,30)+"…":m3uSource.label}
              </div>
            : <div style={{ fontSize:"10px", color:"#444", marginTop:"1px" }}>Demo · M3U yükle →</div>}
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          <button onClick={()=>{ setShowImport(true); setLoadErr(""); setLoadProgress(0); }} style={{
            background:"rgba(124,58,237,0.15)", border:"1px solid rgba(124,58,237,0.35)",
            borderRadius:"10px", padding:"6px 11px", fontSize:"11px", color:"#a78bfa", cursor:"pointer",
            display:"flex", alignItems:"center", gap:"4px" }}>⬆️ M3U</button>
          <div style={{ background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.25)",
            borderRadius:"10px", padding:"6px 10px", fontSize:"11px", color:"#22c55e",
            display:"flex", alignItems:"center", gap:"4px" }}>
            <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#22c55e" }} />
            {channels.length.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>

        {/* ── LIVE ── */}
        {activeTab === "live" && (
          <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>

            {/* Player */}
            <div style={{ margin:"0 14px 8px", borderRadius:"18px", overflow:"hidden",
              background:`linear-gradient(135deg,${selectedCh.color}20,#0d0d18)`,
              border:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
              <div style={{ height:"148px", display:"flex", alignItems:"center", justifyContent:"center", position:"relative",
                background:`radial-gradient(ellipse at 50% 60%,${selectedCh.color}18 0%,transparent 65%)` }}>
                <div style={{ textAlign:"center" }}>
                  <Logo ch={selectedCh} size={52} />
                  <div style={{ fontSize:"14px", fontWeight:800, marginTop:"7px" }}>{selectedCh.name}</div>
                  <div style={{ fontSize:"10px", color:"#555", marginTop:"2px" }}>{selectedCh.category}</div>
                </div>
                <div style={{ position:"absolute", top:"10px", left:"10px", background:"#dc2626", borderRadius:"7px",
                  padding:"3px 8px", fontSize:"10px", fontWeight:800, display:"flex", alignItems:"center", gap:"4px" }}>
                  <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#fff", animation:"pulse 1s infinite" }} />CANLI
                </div>
                {selectedCh.url && (
                  <a href={selectedCh.url} target="_blank" rel="noreferrer" style={{
                    position:"absolute", top:"10px", right:"10px", background:"rgba(124,58,237,0.7)",
                    borderRadius:"7px", padding:"3px 10px", fontSize:"10px", color:"#fff",
                    textDecoration:"none", fontWeight:700 }}>▶ Aç</a>
                )}
              </div>
              <div style={{ padding:"7px 12px 10px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                  <div style={{ fontSize:"12px", fontWeight:700, flex:1, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{selectedCh.name}</div>
                  <button onClick={()=>toggleFav(selectedCh.id)} style={{
                    width:"28px", height:"28px", borderRadius:"9px", border:"none",
                    background: favorites.includes(selectedCh.id)?"rgba(234,179,8,0.2)":"rgba(255,255,255,0.06)",
                    color: favorites.includes(selectedCh.id)?"#EAB308":"#555", cursor:"pointer", fontSize:"14px", flexShrink:0 }}>★</button>
                </div>
                <div style={{ height:"3px", background:"rgba(255,255,255,0.08)", borderRadius:"2px", overflow:"hidden", marginBottom:"7px" }}>
                  <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#7c3aed,#a78bfa)", transition:"width 0.1s" }} />
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <button onClick={()=>{ const i=channels.findIndex(c=>c.id===selectedCh.id); setSelectedCh(channels[(i-1+channels.length)%channels.length]); }}
                    style={{ background:"none",border:"none",color:"#999",fontSize:"16px",cursor:"pointer",padding:0 }}>⏮</button>
                  <button onClick={()=>setIsPlaying(p=>!p)} style={{
                    width:"34px",height:"34px",borderRadius:"10px",border:"none",
                    background:"linear-gradient(135deg,#7c3aed,#4f46e5)",color:"#fff",fontSize:"13px",cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center" }}>{isPlaying?"⏸":"▶"}</button>
                  <button onClick={()=>{ const i=channels.findIndex(c=>c.id===selectedCh.id); setSelectedCh(channels[(i+1)%channels.length]); }}
                    style={{ background:"none",border:"none",color:"#999",fontSize:"16px",cursor:"pointer",padding:0 }}>⏭</button>
                  <div style={{ flex:1, display:"flex", alignItems:"center", gap:"5px" }}>
                    <span style={{ fontSize:"11px" }}>🔊</span>
                    <input type="range" min="0" max="100" value={volume} onChange={e=>setVolume(e.target.value)}
                      style={{ flex:1, accentColor:"#7c3aed", height:"3px" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Search + Filter */}
            <div style={{ padding:"0 14px 7px", flexShrink:0 }}>
              <div style={{ display:"flex",alignItems:"center",gap:"8px",background:"rgba(255,255,255,0.05)",
                borderRadius:"11px",padding:"7px 11px",border:"1px solid rgba(255,255,255,0.06)",marginBottom:"7px" }}>
                <span style={{ color:"#444" }}>🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`${channels.length.toLocaleString()} kanal içinde ara...`}
                  style={{ background:"none",border:"none",color:"#fff",fontSize:"12px",flex:1,outline:"none" }} />
                {search && <button onClick={()=>setSearch("")} style={{ background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:"16px",padding:0 }}>×</button>}
              </div>
              <div style={{ display:"flex", gap:"5px", overflowX:"auto", paddingBottom:"2px" }}>
                {categories.slice(0,20).map(cat => (
                  <button key={cat} onClick={()=>setCategory(cat)} style={{
                    flexShrink:0, padding:"4px 10px", borderRadius:"18px", border:"none",
                    background: activeCategory===cat?"linear-gradient(135deg,#7c3aed,#4f46e5)":"rgba(255,255,255,0.06)",
                    color: activeCategory===cat?"#fff":"#555", fontSize:"10px", fontWeight:600, cursor:"pointer" }}>{cat}</button>
                ))}
              </div>
            </div>

            {/* Virtual Channel List */}
            <div style={{ fontSize:"10px", color:"#2a2a3a", padding:"0 14px 4px" }}>
              {filtered.length.toLocaleString()} {activeCategory!=="Tümü"?`· ${activeCategory}`:""} kanal
            </div>
            <VirtualList items={filtered} containerHeight={260} renderItem={ChannelRow} />
          </div>
        )}

        {/* ── FAVORITES ── */}
        {activeTab === "favorites" && (
          <div style={{ flex:1, overflowY:"auto", padding:"0 14px" }}>
            <div style={{ fontSize:"15px", fontWeight:800, margin:"4px 0 12px" }}>⭐ Favori Kanallar</div>
            {favChannels.length===0 ? (
              <div style={{ textAlign:"center", padding:"50px 20px" }}>
                <div style={{ fontSize:"48px", marginBottom:"12px" }}>⭐</div>
                <div style={{ fontSize:"14px", color:"#555" }}>Henüz favori eklemediniz</div>
                <div style={{ fontSize:"11px", marginTop:"6px", color:"#333" }}>Kanal listesinde ★ butonuna basın</div>
              </div>
            ) : favChannels.map(ch => (
              <div key={ch.id} onClick={()=>{ setSelectedCh(ch); setActiveTab("live"); }} style={{
                display:"flex", alignItems:"center", gap:"12px", padding:"10px 12px",
                borderRadius:"13px", marginBottom:"6px",
                background:`linear-gradient(135deg,${ch.color}10,rgba(255,255,255,0.025))`,
                border:`1px solid ${ch.color}20`, cursor:"pointer" }}>
                <Logo ch={ch} size={46} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"13px", fontWeight:700 }}>{ch.name}</div>
                  <div style={{ fontSize:"10px", color:"#555", marginTop:"2px" }}>{ch.category}</div>
                </div>
                <button onClick={e=>{ e.stopPropagation(); toggleFav(ch.id); }}
                  style={{ background:"none",border:"none",color:"#EAB308",cursor:"pointer",fontSize:"17px" }}>★</button>
              </div>
            ))}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === "settings" && (
          <div style={{ flex:1, overflowY:"auto", padding:"0 14px" }}>
            <div style={{ fontSize:"15px", fontWeight:800, margin:"4px 0 14px" }}>⚙️ Ayarlar & M3U</div>
            <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:"14px", padding:"14px", marginBottom:"12px", border:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize:"10px", color:"#444", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Aktif Kaynak</div>
              {m3uSource ? (
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"12px" }}>
                    <span style={{ fontSize:"24px" }}>{m3uSource.type==="url"?"🔗":"📁"}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:"12px", fontWeight:700, color:"#a78bfa" }}>{m3uSource.type==="url"?"URL Kaynağı":"Yerel Dosya"}</div>
                      <div style={{ fontSize:"9px", color:"#555", marginTop:"2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m3uSource.label}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"6px" }}>
                    {[[channels.length.toLocaleString(),"Kanal","#22c55e","rgba(34,197,94,0.1)"],
                       [favorites.length,"Favori","#EAB308","rgba(234,179,8,0.1)"],
                       [categories.length-1,"Kategori","#a78bfa","rgba(124,58,237,0.1)"]
                    ].map(([val,lbl,col,bg]) => (
                      <div key={lbl} style={{ flex:1, background:bg, borderRadius:"9px", padding:"8px 6px", textAlign:"center" }}>
                        <div style={{ fontSize:"15px", fontWeight:800, color:col }}>{val}</div>
                        <div style={{ fontSize:"9px", color:"#555" }}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ color:"#444", fontSize:"12px" }}>Demo liste aktif. Kendi M3U listenizi yükleyin.</div>
              )}
            </div>
            <button onClick={()=>setShowImport(true)} style={{
              width:"100%", padding:"13px", borderRadius:"12px", border:"1px solid rgba(124,58,237,0.4)",
              background:"rgba(124,58,237,0.12)", color:"#a78bfa", fontSize:"13px", fontWeight:700, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginBottom:"8px" }}>
              ⬆️  M3U Listesi Yükle / Güncelle
            </button>
            {m3uSource && (
              <button onClick={()=>{ setChannels(DEMO); setM3uSource(null); setSelectedCh(DEMO[0]); localStorage.removeItem(SRC_KEY); toast("Demo listeye dönüldü"); }} style={{
                width:"100%", padding:"12px", borderRadius:"12px", border:"1px solid rgba(239,68,68,0.3)",
                background:"rgba(239,68,68,0.07)", color:"#ef4444", fontSize:"13px", fontWeight:700, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
                🗑  Listeyi Sıfırla
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ padding:"8px 16px 28px", display:"flex", justifyContent:"space-around",
        background:"rgba(8,8,16,0.95)", borderTop:"1px solid rgba(255,255,255,0.05)", flexShrink:0 }}>
        {[["live","📺","Canlı"],["favorites","⭐","Favori"],["settings","⚙️","Ayarlar"]].map(([id,icon,label]) => (
          <button key={id} onClick={()=>setActiveTab(id)} style={{
            background:"none", border:"none", cursor:"pointer",
            display:"flex", flexDirection:"column", alignItems:"center", gap:"2px",
            color: activeTab===id?"#a78bfa":"#3a3a4a", padding:"0" }}>
            <div style={{ width:"34px", height:"34px", borderRadius:"11px",
              background: activeTab===id?"rgba(124,58,237,0.18)":"transparent",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:"17px" }}>{icon}</div>
            <span style={{ fontSize:"9px", fontWeight: activeTab===id?700:400 }}>{label}</span>
          </button>
        ))}
      </div>

      {/* ═══ M3U IMPORT MODAL ═══ */}
      {showImport && (
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.9)", backdropFilter:"blur(10px)",
          display:"flex", alignItems:"flex-end", zIndex:200 }}>
          <div style={{ width:"100%", background:"#0f0f1a", borderRadius:"24px 24px 0 0",
            border:"1px solid rgba(255,255,255,0.08)", padding:"20px 20px 44px" }}>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
              <div>
                <div style={{ fontSize:"16px", fontWeight:800 }}>⬆️ M3U Listesi Yükle</div>
                <div style={{ fontSize:"11px", color:"#444", marginTop:"2px" }}>100.000+ kanal desteklenir</div>
              </div>
              <button onClick={()=>{ if(!loading){ setShowImport(false); setLoadErr(""); setLoadProgress(0); }}} style={{
                background:"rgba(255,255,255,0.07)",border:"none",borderRadius:"10px",
                width:"32px",height:"32px",color:"#888",cursor:"pointer",fontSize:"18px" }}>×</button>
            </div>

            {/* Tabs */}
            <div style={{ display:"flex", gap:"6px", marginBottom:"14px" }}>
              {[["file","📁 Dosyadan (Önerilen)"],["url","🔗 URL'den"]].map(([t,lbl]) => (
                <button key={t} onClick={()=>{ if(!loading){ setImportTab(t); setLoadErr(""); setLoadProgress(0); }}} style={{
                  flex:1, padding:"9px", borderRadius:"10px", border:"none",
                  background: importTab===t?"linear-gradient(135deg,#7c3aed,#4f46e5)":"rgba(255,255,255,0.07)",
                  color: importTab===t?"#fff":"#555", fontSize:"11px", fontWeight:700, cursor:"pointer" }}>{lbl}</button>
              ))}
            </div>

            {importTab==="file" ? (
              <div>
                <input ref={fileRef} type="file" accept=".m3u,.m3u8,.txt" onChange={loadFromFile} style={{ display:"none" }} />
                <button onClick={()=>!loading&&fileRef.current?.click()} style={{
                  width:"100%", padding:"28px 12px", borderRadius:"14px",
                  border:"2px dashed rgba(124,58,237,0.4)", background:"rgba(124,58,237,0.06)",
                  color: loading?"#666":"#a78bfa", fontSize:"13px", fontWeight:700, cursor: loading?"default":"pointer",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:"8px" }}>
                  <span style={{ fontSize:"34px" }}>📁</span>
                  {loading ? "İşleniyor..." : "Dosya Seç (.m3u / .m3u8)"}
                  <span style={{ fontSize:"10px", color:"#444", fontWeight:400 }}>Mac'te Finder'dan sürükleyip bırakabilirsiniz</span>
                </button>
                <div style={{ marginTop:"10px", padding:"10px", background:"rgba(34,197,94,0.05)", borderRadius:"10px", border:"1px solid rgba(34,197,94,0.15)" }}>
                  <div style={{ fontSize:"10px", color:"#22c55e", marginBottom:"3px", fontWeight:700 }}>✅ Neden önerilen?</div>
                  <div style={{ fontSize:"10px", color:"#555", lineHeight:"1.6" }}>
                    100K+ kanal içeren büyük M3U dosyaları URL üzerinden yüklenemez. Dosyayı Mac'inize indirip buradan seçin — çok daha hızlı ve güvenilir çalışır.
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <input value={m3uUrl} onChange={e=>setM3uUrl(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&!loading&&loadFromUrl()}
                  placeholder="http://sunucu.com/playlist.m3u"
                  style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
                    borderRadius:"10px", padding:"10px 12px", color:"#fff", fontSize:"12px", outline:"none",
                    marginBottom:"10px", boxSizing:"border-box" }} />
                <button onClick={()=>!loading&&loadFromUrl()} style={{
                  width:"100%", padding:"13px", borderRadius:"12px", border:"none",
                  background: loading?"rgba(124,58,237,0.3)":"linear-gradient(135deg,#7c3aed,#4f46e5)",
                  color:"#fff", fontSize:"13px", fontWeight:800, cursor: loading?"default":"pointer" }}>
                  {loading?"⏳ Yükleniyor...":"✅ Listeyi Yükle"}
                </button>
                <div style={{ marginTop:"8px", padding:"8px 10px", background:"rgba(239,68,68,0.06)", borderRadius:"10px", border:"1px solid rgba(239,68,68,0.15)" }}>
                  <div style={{ fontSize:"10px", color:"#ef4444", lineHeight:"1.6" }}>
                    ⚠️ 100K+ kanal içeren listeler URL üzerinden yüklenemeyebilir. Dosyadan yükleme önerilir.
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {loading && (
              <div style={{ marginTop:"12px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"10px", color:"#555", marginBottom:"5px" }}>
                  <span>{loadErr || "İşleniyor..."}</span>
                  <span style={{ color:"#a78bfa" }}>{loadCount.toLocaleString()} kanal · %{loadProgress}</span>
                </div>
                <div style={{ height:"6px", background:"rgba(255,255,255,0.08)", borderRadius:"3px", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${loadProgress}%`, background:"linear-gradient(90deg,#7c3aed,#22c55e)", borderRadius:"3px", transition:"width 0.3s" }} />
                </div>
              </div>
            )}

            {/* Error */}
            {!loading && loadErr && (
              <div style={{ marginTop:"10px", padding:"10px 12px", background:"rgba(239,68,68,0.1)",
                border:"1px solid rgba(239,68,68,0.3)", borderRadius:"10px", fontSize:"12px",
                color: loadErr.startsWith("❌")?"#ef4444":"#a78bfa" }}>
                {loadErr}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {notif && (
        <div style={{ position:"absolute", bottom:"90px", left:"50%", transform:"translateX(-50%)",
          background:"rgba(15,15,25,0.95)", backdropFilter:"blur(12px)",
          border:"1px solid rgba(124,58,237,0.3)", borderRadius:"12px",
          padding:"9px 16px", fontSize:"12px", fontWeight:600, whiteSpace:"nowrap", zIndex:300 }}>
          {notif}
        </div>
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
