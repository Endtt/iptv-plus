import { useState, useEffect, useRef, useMemo } from "react";

// ─── M3U PARSER ───────────────────────────────────────────────────────────────
function parseM3U(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const channels = [];
  let current = null;
  const COLORS = ["#E63946","#F4A261","#2A9D8F","#E9C46A","#264653","#6A0572","#1B4332","#FF6B6B","#4CC9F0","#F77F00","#3D405B","#7209B7","#D62828","#023E8A","#2D6A4F"];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("#EXTINF")) {
      current = {};
      const nameMatch = line.match(/,(.+)$/);
      current.name = nameMatch ? nameMatch[1].trim() : "Kanal";
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      current.logo = logoMatch ? logoMatch[1] : null;
      const groupMatch = line.match(/group-title="([^"]+)"/);
      current.category = groupMatch ? groupMatch[1] : "Genel";
      current.emoji = categoryEmoji(current.category);
    } else if (line.startsWith("http") || line.startsWith("rtmp") || line.startsWith("rtsp")) {
      if (current) {
        current.url = line;
        current.id = channels.length + 1;
        current.live = true;
        current.color = COLORS[channels.length % COLORS.length];
        channels.push(current);
        current = null;
      }
    }
  }
  return channels;
}

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

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO_CHANNELS = [
  { id:1, name:"TRT 1", category:"Ulusal", emoji:"📺", color:"#E63946", live:true, url:"", logo:null },
  { id:2, name:"Show TV", category:"Ulusal", emoji:"🎬", color:"#F4A261", live:true, url:"", logo:null },
  { id:3, name:"Kanal D", category:"Ulusal", emoji:"📡", color:"#2A9D8F", live:true, url:"", logo:null },
  { id:4, name:"CNN Türk", category:"Haber", emoji:"📰", color:"#E9C46A", live:true, url:"", logo:null },
  { id:5, name:"NTV", category:"Haber", emoji:"📰", color:"#264653", live:true, url:"", logo:null },
  { id:6, name:"beIN Sports", category:"Spor", emoji:"⚽", color:"#6A0572", live:true, url:"", logo:null },
  { id:7, name:"TRT Spor", category:"Spor", emoji:"🏆", color:"#1B4332", live:true, url:"", logo:null },
  { id:8, name:"Cartoon Network", category:"Çocuk", emoji:"🎨", color:"#FF6B6B", live:true, url:"", logo:null },
];

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "iptv_channels_v2";
const SOURCE_KEY  = "iptv_source_v2";

function saveToStorage(chs, src) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chs)); localStorage.setItem(SOURCE_KEY, JSON.stringify(src)); } catch(e){}
}
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const src = localStorage.getItem(SOURCE_KEY);
    if (raw) return { channels: JSON.parse(raw), source: src ? JSON.parse(src) : null };
  } catch(e){}
  return { channels: null, source: null };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function IPTVApp() {
  const saved = loadFromStorage();
  const [channels, setChannels]       = useState(saved.channels || DEMO_CHANNELS);
  const [m3uSource, setM3uSource]     = useState(saved.source || null);
  const [activeTab, setActiveTab]     = useState("live");
  const [selectedCh, setSelectedCh]  = useState((saved.channels || DEMO_CHANNELS)[0]);
  const [activeCategory, setCategory] = useState("Tümü");
  const [favorites, setFavorites]     = useState([]);
  const [search, setSearch]           = useState("");
  const [isPlaying, setIsPlaying]     = useState(true);
  const [volume, setVolume]           = useState(75);
  const [progress, setProgress]       = useState(28);
  const [time, setTime]               = useState(new Date());
  const [notif, setNotif]             = useState(null);
  const [showImport, setShowImport]   = useState(false);
  const [importTab, setImportTab]     = useState("url");
  const [m3uUrl, setM3uUrl]           = useState("");
  const [loading, setLoading]         = useState(false);
  const [loadErr, setLoadErr]         = useState("");
  const fileRef = useRef(null);

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => setProgress(p => p >= 100 ? 0 : +(p+0.04).toFixed(2)), 100);
    return () => clearInterval(t);
  }, [isPlaying]);

  const toast = (msg) => { setNotif(msg); setTimeout(() => setNotif(null), 2800); };

  const categories = useMemo(() => {
    const cats = [...new Set(channels.map(c => c.category).filter(Boolean))].sort();
    return ["Tümü", ...cats];
  }, [channels]);

  const filtered = useMemo(() => channels.filter(c =>
    (activeCategory === "Tümü" || c.category === activeCategory) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  ), [channels, activeCategory, search]);

  const favChannels = useMemo(() => channels.filter(c => favorites.includes(c.id)), [channels, favorites]);

  const applyChannels = (chs, source) => {
    setChannels(chs); setM3uSource(source);
    setSelectedCh(chs[0]); setCategory("Tümü");
    saveToStorage(chs, source);
    setShowImport(false);
    toast(`✅ ${chs.length} kanal yüklendi!`);
  };

  const loadFromUrl = async () => {
    if (!m3uUrl.trim()) { setLoadErr("Lütfen bir URL girin."); return; }
    setLoading(true); setLoadErr("");
    try {
      const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(m3uUrl.trim())}`;
      const res = await fetch(proxy);
      if (!res.ok) throw new Error("Sunucuya ulaşılamadı.");
      const text = await res.text();
      if (!text.includes("#EXTINF")) throw new Error("Geçerli bir M3U dosyası değil.");
      const chs = parseM3U(text);
      if (!chs.length) throw new Error("Hiç kanal bulunamadı. M3U formatını kontrol edin.");
      applyChannels(chs, { type:"url", label: m3uUrl.trim() });
    } catch(e) { setLoadErr(e.message || "Yükleme başarısız."); }
    setLoading(false);
  };

  const loadFromFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true); setLoadErr("");
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = ev.target.result;
        if (!text.includes("#EXTINF")) throw new Error("Geçerli bir M3U dosyası değil.");
        const chs = parseM3U(text);
        if (!chs.length) throw new Error("Hiç kanal bulunamadı.");
        applyChannels(chs, { type:"file", label: file.name });
      } catch(err) { setLoadErr(err.message); }
      setLoading(false);
    };
    reader.onerror = () => { setLoadErr("Dosya okunamadı."); setLoading(false); };
    reader.readAsText(file);
  };

  const toggleFav = (id) => {
    setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
    toast(favorites.includes(id) ? "Favorilerden çıkarıldı" : "Favorilere eklendi ⭐");
  };

  const Logo = ({ ch, size=40 }) => (
    <div style={{ width:size, height:size, borderRadius:size*0.28, background:`${ch.color}28`,
      display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0, position:"relative" }}>
      {ch.logo && <img src={ch.logo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute" }}
        onError={e => { e.target.style.display="none"; }} />}
      <span style={{ fontSize:size*0.44 }}>{ch.emoji||"📡"}</span>
    </div>
  );

  const s = { display:"flex", flexDirection:"column" };

  return (
    <div style={{ width:"390px", height:"844px", margin:"0 auto", background:"#080810", color:"#fff",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      borderRadius:"40px", overflow:"hidden", position:"relative",
      boxShadow:"0 40px 100px rgba(0,0,0,0.8),inset 0 1px 0 rgba(255,255,255,0.1)",
      ...s }}>

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
                {m3uSource.type==="url"?"🔗":"📁"} {m3uSource.label.length>30?m3uSource.label.slice(0,30)+"…":m3uSource.label}
              </div>
            : <div style={{ fontSize:"10px", color:"#444", marginTop:"1px" }}>Demo Liste</div>}
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          <button onClick={()=>{ setShowImport(true); setLoadErr(""); }} style={{
            background:"rgba(124,58,237,0.15)", border:"1px solid rgba(124,58,237,0.35)",
            borderRadius:"10px", padding:"6px 11px", fontSize:"11px", color:"#a78bfa", cursor:"pointer",
            display:"flex", alignItems:"center", gap:"4px" }}>⬆️ M3U</button>
          <div style={{ background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.25)",
            borderRadius:"10px", padding:"6px 10px", fontSize:"11px", color:"#22c55e",
            display:"flex", alignItems:"center", gap:"4px" }}>
            <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#22c55e" }} />
            {channels.length} Kanal
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>

        {/* ── LIVE ── */}
        {activeTab === "live" && (
          <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
            {/* Player */}
            <div style={{ margin:"0 14px 10px", borderRadius:"18px", overflow:"hidden",
              background:`linear-gradient(135deg,${selectedCh.color}20,#0d0d18)`,
              border:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
              <div style={{ height:"155px", display:"flex", alignItems:"center", justifyContent:"center", position:"relative",
                background:`radial-gradient(ellipse at 50% 60%,${selectedCh.color}18 0%,transparent 65%)` }}>
                <div style={{ textAlign:"center" }}>
                  <Logo ch={selectedCh} size={54} />
                  <div style={{ fontSize:"14px", fontWeight:800, marginTop:"7px" }}>{selectedCh.name}</div>
                  <div style={{ fontSize:"10px", color:"#555", marginTop:"2px" }}>{selectedCh.category}</div>
                </div>
                <div style={{ position:"absolute", top:"10px", left:"10px", background:"#dc2626", borderRadius:"7px",
                  padding:"3px 8px", fontSize:"10px", fontWeight:800, display:"flex", alignItems:"center", gap:"4px" }}>
                  <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#fff", animation:"pulse 1s infinite" }} />
                  CANLI
                </div>
                {selectedCh.url && (
                  <a href={selectedCh.url} target="_blank" rel="noreferrer" style={{
                    position:"absolute", top:"10px", right:"10px", background:"rgba(0,0,0,0.6)",
                    borderRadius:"7px", padding:"3px 8px", fontSize:"9px", color:"#aaa",
                    textDecoration:"none", maxWidth:"120px", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", display:"block" }}>
                    ▶ Aç
                  </a>
                )}
              </div>
              <div style={{ padding:"8px 12px 12px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                  <div style={{ fontSize:"12px", fontWeight:700 }}>{selectedCh.name}</div>
                  <button onClick={()=>toggleFav(selectedCh.id)} style={{
                    width:"28px", height:"28px", borderRadius:"9px", border:"none",
                    background: favorites.includes(selectedCh.id)?"rgba(234,179,8,0.2)":"rgba(255,255,255,0.06)",
                    color: favorites.includes(selectedCh.id)?"#EAB308":"#555", cursor:"pointer", fontSize:"14px" }}>★</button>
                </div>
                <div style={{ height:"3px", background:"rgba(255,255,255,0.08)", borderRadius:"2px", overflow:"hidden", marginBottom:"8px" }}>
                  <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#7c3aed,#a78bfa)", transition:"width 0.1s" }} />
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <button onClick={()=>{ const i=channels.findIndex(c=>c.id===selectedCh.id); setSelectedCh(channels[(i-1+channels.length)%channels.length]); }}
                    style={{ background:"none",border:"none",color:"#999",fontSize:"16px",cursor:"pointer" }}>⏮</button>
                  <button onClick={()=>setIsPlaying(p=>!p)} style={{
                    width:"36px",height:"36px",borderRadius:"11px",border:"none",
                    background:"linear-gradient(135deg,#7c3aed,#4f46e5)",color:"#fff",fontSize:"14px",cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center" }}>{isPlaying?"⏸":"▶"}</button>
                  <button onClick={()=>{ const i=channels.findIndex(c=>c.id===selectedCh.id); setSelectedCh(channels[(i+1)%channels.length]); }}
                    style={{ background:"none",border:"none",color:"#999",fontSize:"16px",cursor:"pointer" }}>⏭</button>
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
                borderRadius:"11px",padding:"7px 11px",border:"1px solid rgba(255,255,255,0.06)",marginBottom:"8px" }}>
                <span style={{ color:"#444" }}>🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`${channels.length} kanal içinde ara...`}
                  style={{ background:"none",border:"none",color:"#fff",fontSize:"12px",flex:1,outline:"none" }} />
                {search && <button onClick={()=>setSearch("")} style={{ background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:"16px" }}>×</button>}
              </div>
              <div style={{ display:"flex", gap:"5px", overflowX:"auto" }}>
                {categories.slice(0,15).map(cat => (
                  <button key={cat} onClick={()=>setCategory(cat)} style={{
                    flexShrink:0, padding:"4px 10px", borderRadius:"18px", border:"none",
                    background: activeCategory===cat?"linear-gradient(135deg,#7c3aed,#4f46e5)":"rgba(255,255,255,0.06)",
                    color: activeCategory===cat?"#fff":"#555", fontSize:"10px", fontWeight:600, cursor:"pointer" }}>{cat}</button>
                ))}
              </div>
            </div>

            {/* List */}
            <div style={{ flex:1, overflowY:"auto", padding:"0 14px" }}>
              <div style={{ fontSize:"10px", color:"#2a2a3a", marginBottom:"5px" }}>
                {filtered.length} / {channels.length} kanal {activeCategory!=="Tümü"?`· ${activeCategory}`:""}
              </div>
              {filtered.slice(0,300).map(ch => (
                <div key={ch.id} onClick={()=>setSelectedCh(ch)} style={{
                  display:"flex", alignItems:"center", gap:"10px",
                  padding:"8px 10px", borderRadius:"12px", marginBottom:"4px",
                  background: selectedCh.id===ch.id?`linear-gradient(135deg,${ch.color}18,rgba(124,58,237,0.07))`:"rgba(255,255,255,0.025)",
                  border: selectedCh.id===ch.id?`1px solid ${ch.color}30`:"1px solid rgba(255,255,255,0.03)",
                  cursor:"pointer" }}>
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
              ))}
              {filtered.length > 300 && (
                <div style={{ textAlign:"center", padding:"10px", color:"#333", fontSize:"10px" }}>
                  +{filtered.length-300} kanal daha · aramayı daralt
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FAVORITES ── */}
        {activeTab === "favorites" && (
          <div style={{ flex:1, overflowY:"auto", padding:"0 14px" }}>
            <div style={{ fontSize:"15px", fontWeight:800, margin:"4px 0 12px" }}>⭐ Favori Kanallar</div>
            {favChannels.length===0 ? (
              <div style={{ textAlign:"center", padding:"50px 20px", color:"#333" }}>
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
                    <div>
                      <div style={{ fontSize:"12px", fontWeight:700, color:"#a78bfa" }}>{m3uSource.type==="url"?"URL Kaynağı":"Yerel Dosya"}</div>
                      <div style={{ fontSize:"9px", color:"#555", marginTop:"2px", wordBreak:"break-all" }}>{m3uSource.label}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"6px" }}>
                    {[[channels.length,"Kanal","#22c55e","rgba(34,197,94,0.1)","rgba(34,197,94,0.2)"],
                       [favorites.length,"Favori","#EAB308","rgba(234,179,8,0.1)","rgba(234,179,8,0.2)"],
                       [categories.length-1,"Kategori","#a78bfa","rgba(124,58,237,0.1)","rgba(124,58,237,0.2)"]
                    ].map(([val,lbl,col,bg,br]) => (
                      <div key={lbl} style={{ flex:1, background:bg, border:`1px solid ${br}`, borderRadius:"9px", padding:"8px 6px", textAlign:"center" }}>
                        <div style={{ fontSize:"18px", fontWeight:800, color:col }}>{val}</div>
                        <div style={{ fontSize:"9px", color:"#555" }}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ color:"#444", fontSize:"12px" }}>Demo liste aktif. M3U yüklemek için aşağıdaki butona tıklayın.</div>
              )}
            </div>

            <button onClick={()=>setShowImport(true)} style={{
              width:"100%", padding:"13px", borderRadius:"12px", border:"1px solid rgba(124,58,237,0.4)",
              background:"rgba(124,58,237,0.12)", color:"#a78bfa", fontSize:"13px", fontWeight:700, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginBottom:"8px" }}>
              ⬆️  M3U Listesi Yükle / Güncelle
            </button>

            {m3uSource && (
              <button onClick={()=>{ setChannels(DEMO_CHANNELS); setM3uSource(null); setSelectedCh(DEMO_CHANNELS[0]);
                localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(SOURCE_KEY); toast("Demo listeye dönüldü"); }} style={{
                width:"100%", padding:"12px", borderRadius:"12px", border:"1px solid rgba(239,68,68,0.3)",
                background:"rgba(239,68,68,0.07)", color:"#ef4444", fontSize:"13px", fontWeight:700, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginBottom:"14px" }}>
                🗑  Listeyi Sıfırla
              </button>
            )}

            <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:"12px", padding:"12px", border:"1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize:"10px", color:"#444", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>M3U Format Örneği</div>
              <pre style={{ fontFamily:"monospace", fontSize:"9px", color:"#555", lineHeight:"1.7", margin:0, whiteSpace:"pre-wrap" }}>
{`#EXTM3U
#EXTINF:-1 tvg-logo="https://logo.url/trt.png" group-title="Ulusal",TRT 1
http://stream.example.com/trt1

#EXTINF:-1 group-title="Haber",CNN Türk
http://stream.example.com/cnnturk`}
              </pre>
            </div>
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

      {/* M3U Import Modal */}
      {showImport && (
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(10px)",
          display:"flex", alignItems:"flex-end", zIndex:200 }}>
          <div style={{ width:"100%", background:"#0f0f1a", borderRadius:"24px 24px 0 0",
            border:"1px solid rgba(255,255,255,0.08)", padding:"20px 20px 44px" }}>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
              <div>
                <div style={{ fontSize:"16px", fontWeight:800 }}>⬆️ M3U Listesi Yükle</div>
                <div style={{ fontSize:"11px", color:"#444", marginTop:"2px" }}>URL veya .m3u / .m3u8 dosyası</div>
              </div>
              <button onClick={()=>setShowImport(false)} style={{ background:"rgba(255,255,255,0.07)",border:"none",
                borderRadius:"10px",width:"32px",height:"32px",color:"#888",cursor:"pointer",fontSize:"18px" }}>×</button>
            </div>

            <div style={{ display:"flex", gap:"6px", marginBottom:"16px" }}>
              {[["url","🔗 URL'den"],["file","📁 Dosyadan"]].map(([t,lbl]) => (
                <button key={t} onClick={()=>{ setImportTab(t); setLoadErr(""); }} style={{
                  flex:1, padding:"9px", borderRadius:"10px", border:"none",
                  background: importTab===t?"linear-gradient(135deg,#7c3aed,#4f46e5)":"rgba(255,255,255,0.07)",
                  color: importTab===t?"#fff":"#555", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>{lbl}</button>
              ))}
            </div>

            {importTab==="url" ? (
              <div>
                <div style={{ fontSize:"11px", color:"#555", marginBottom:"8px" }}>M3U playlist URL'ini girin (http:// veya https://)</div>
                <input value={m3uUrl} onChange={e=>setM3uUrl(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&loadFromUrl()}
                  placeholder="http://sunucu.com/playlist.m3u veya .m3u8"
                  style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
                    borderRadius:"10px", padding:"10px 12px", color:"#fff", fontSize:"12px", outline:"none",
                    marginBottom:"10px", boxSizing:"border-box" }} />
                <button onClick={loadFromUrl} disabled={loading} style={{
                  width:"100%", padding:"13px", borderRadius:"12px", border:"none",
                  background: loading?"rgba(124,58,237,0.3)":"linear-gradient(135deg,#7c3aed,#4f46e5)",
                  color:"#fff", fontSize:"13px", fontWeight:800, cursor: loading?"default":"pointer" }}>
                  {loading?"⏳ Yükleniyor...":"✅ Listeyi Yükle"}
                </button>
                <div style={{ marginTop:"10px", padding:"10px", background:"rgba(255,255,255,0.03)", borderRadius:"10px" }}>
                  <div style={{ fontSize:"10px", color:"#555", lineHeight:"1.6" }}>
                    💡 IPTV servis sağlayıcınız genellikle şu formatta URL verir:<br/>
                    <span style={{ color:"#444", fontFamily:"monospace" }}>http://sunucu:port/get.php?username=...&password=...&type=m3u</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize:"11px", color:"#555", marginBottom:"12px" }}>Mac'inizdeki .m3u veya .m3u8 dosyasını seçin</div>
                <input ref={fileRef} type="file" accept=".m3u,.m3u8,.txt" onChange={loadFromFile} style={{ display:"none" }} />
                <button onClick={()=>fileRef.current?.click()} disabled={loading} style={{
                  width:"100%", padding:"30px 12px", borderRadius:"14px",
                  border:"2px dashed rgba(124,58,237,0.4)", background:"rgba(124,58,237,0.06)",
                  color:"#a78bfa", fontSize:"13px", fontWeight:700, cursor:"pointer",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:"8px" }}>
                  <span style={{ fontSize:"34px" }}>📁</span>
                  {loading?"⏳ Dosya okunuyor...":"Dosya Seç (.m3u / .m3u8)"}
                  <span style={{ fontSize:"10px", color:"#555", fontWeight:400 }}>Finder'dan sürükleyip de bırakabilirsiniz</span>
                </button>
              </div>
            )}

            {loadErr && (
              <div style={{ marginTop:"10px", padding:"10px 12px", background:"rgba(239,68,68,0.1)",
                border:"1px solid rgba(239,68,68,0.3)", borderRadius:"10px", fontSize:"12px", color:"#ef4444" }}>
                ❌ {loadErr}
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
