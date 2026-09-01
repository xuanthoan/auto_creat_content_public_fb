import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { LayoutDashboard, Sparkles, Images, CalendarDays, Send, BarChart3, Settings, Search, Bell, ChevronDown, TrendingUp, FileText, Heart, MessageCircle, Plus, Clock3, CircleCheck, MoreHorizontal, WandSparkles, Zap, Upload, HardDrive, Film, Trash2, RefreshCw, X } from 'lucide-react'
import { invokeDesktop, isDesktop, localAssetUrl } from './tauri.js'

const chartData = [
  { day: 'T2', posts: 5, engagement: 520 }, { day: 'T3', posts: 7, engagement: 680 },
  { day: 'T4', posts: 6, engagement: 610 }, { day: 'T5', posts: 10, engagement: 920 },
  { day: 'T6', posts: 8, engagement: 780 }, { day: 'T7', posts: 12, engagement: 1180 },
  { day: 'CN', posts: 9, engagement: 970 },
]

const posts = [
  { title: '5 bí quyết để bắt đầu ngày mới tràn đầy năng lượng ✨', page: 'Sống Tích Cực', date: 'Hôm nay, 08:30', type: 'Ảnh + văn bản', status: 'Đã đăng', color: '#f0a86e', initials: 'ST', reach: '12.4K', likes: 842, comments: 73 },
  { title: 'Không cần hoàn hảo, chỉ cần tốt hơn chính mình hôm qua.', page: 'Daily Motivation', date: 'Hôm qua, 19:00', type: 'Văn bản', status: 'Đã đăng', color: '#7469d5', initials: 'DM', reach: '8.7K', likes: 621, comments: 48 },
  { title: 'Một góc bình yên giữa lòng thành phố 🌿', page: 'Chill Mỗi Ngày', date: '30/08, 20:15', type: 'Video', status: 'Đã đăng', color: '#4b9b7d', initials: 'CM', reach: '—', likes: 0, comments: 0, pending: true },
]

const nav = [
  ['Tổng quan', LayoutDashboard], ['AI Content', Sparkles], ['Kho nội dung', FileText],
  ['Thư viện media', Images], ['Lịch nội dung', CalendarDays], ['Đăng bài', Send], ['Báo cáo', BarChart3],
]

function StatCard({ icon: Icon, iconClass, label, value, delta, sub }) {
  return <div className="stat-card">
    <div className={`stat-icon ${iconClass}`}><Icon size={20}/></div>
    <div className="stat-label">{label}</div>
    <div className="stat-row"><strong>{value}</strong>{delta && <span className="delta"><TrendingUp size={13}/> {delta}</span>}</div>
    <div className="stat-sub">{sub}</div>
  </div>
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`
}

function MediaLibrary() {
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const desktop = isDesktop()

  const refresh = async () => {
    if (!desktop) return
    setBusy(true)
    try {
      const stored = await invokeDesktop('list_media')
      const withUrls = await Promise.all(stored.map(async item => ({ ...item, url: await localAssetUrl(item.path) })))
      setItems(withUrls)
      setError('')
    } catch (reason) { setError(String(reason)) } finally { setBusy(false) }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const importFiles = async () => {
    setBusy(true)
    try { await invokeDesktop('import_media'); await refresh() }
    catch (reason) { setError(String(reason)); setBusy(false) }
  }

  const remove = async (id) => {
    if (!window.confirm('Xóa media này khỏi kho lưu trữ cục bộ?')) return
    try { await invokeDesktop('delete_media', { id }); await refresh() }
    catch (reason) { setError(String(reason)) }
  }

  return <section className="media-page">
    <div className="page-heading"><div><p>QUẢN LÝ TỆP CỤC BỘ</p><h1>Thư viện media</h1><span>Ảnh và video được sao chép vào vùng dữ liệu riêng của ứng dụng trên máy tính.</span></div><div className="media-actions"><button className="outline" onClick={refresh} disabled={!desktop || busy}><RefreshCw size={16}/> Làm mới</button><button className="primary" onClick={importFiles} disabled={!desktop || busy}><Upload size={17}/> {busy ? 'Đang xử lý...' : 'Nhập media'}</button></div></div>
    {!desktop && <div className="desktop-notice"><HardDrive size={23}/><div><strong>Hãy mở bằng ứng dụng FlowPost AI Desktop</strong><span>Trình duyệt chỉ dùng để xem trước giao diện. Quyền chọn và lưu tệp cục bộ chỉ được bật trong bản Tauri.</span></div></div>}
    {error && <div className="error-box">{error}</div>}
    <div className="media-summary"><div><Images size={18}/><span><b>{items.filter(i => i.mediaType === 'image').length}</b> hình ảnh</span></div><div><Film size={18}/><span><b>{items.filter(i => i.mediaType === 'video').length}</b> video</span></div><div><HardDrive size={18}/><span><b>{formatBytes(items.reduce((sum, item) => sum + item.size, 0))}</b> đã sử dụng</span></div></div>
    {items.length ? <div className="media-grid">{items.map(item => <article className="media-card" key={item.id}><div className="media-preview">{item.mediaType === 'image' ? <img src={item.url} alt={item.name}/> : <><video src={item.url}/><div className="video-badge"><Film size={15}/> VIDEO</div></>}</div><div className="media-info"><div><strong title={item.name}>{item.name}</strong><span>{item.extension.toUpperCase()} • {formatBytes(item.size)}</span></div><button aria-label={`Xóa ${item.name}`} onClick={() => remove(item.id)}><Trash2 size={16}/></button></div></article>)}</div> : <div className="media-empty"><div><Images size={34}/></div><h2>Kho media đang trống</h2><p>Nhập hình ảnh hoặc video từ ổ cứng để dùng khi tạo và đăng bài.</p><button className="primary" onClick={importFiles} disabled={!desktop}><Upload size={17}/> Chọn tệp từ máy tính</button></div>}
  </section>
}

function ProvidersPanel() {
  const desktop = isDesktop()
  const [providers, setProviders] = useState([])
  const [form, setForm] = useState({ id: 'custom-provider', displayName: 'Custom provider', baseUrl: 'http://localhost:20128/v1', protocol: 'openai-completions', apiKey: '', models: [] })
  const [hasApiKey, setHasApiKey] = useState(false)
  const [modelInput, setModelInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const load = async () => {
    if (!desktop) return
    try {
      const list = await invokeDesktop('list_providers')
      setProviders(list)
      if (list.length > 0) {
        const p = list[0]
        setForm({ id: p.id, displayName: p.displayName || p.id, baseUrl: p.baseUrl, protocol: p.protocol, apiKey: '', models: p.models || [] })
        setHasApiKey(!!p.hasApiKey)
        setIsEditing(true)
      } else {
        setIsEditing(false)
      }
    } catch (e) { setErr(String(e)) }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!form.id.trim()) { setErr('Provider ID không được để trống'); return }
    if (!form.baseUrl.trim()) { setErr('Base URL không được để trống'); return }
    setBusy(true); setErr(''); setMsg('')
    try {
      if (!isEditing) {
        const payload = { id: form.id.trim().toLowerCase(), displayName: form.displayName || null, baseUrl: form.baseUrl, protocol: form.protocol, models: form.models.length ? form.models : null, apiKey: form.apiKey || null }
        await invokeDesktop('create_provider', { payload })
        setMsg('Đã tạo provider')
      } else {
        const payload = { displayName: form.displayName || null, baseUrl: form.baseUrl, protocol: form.protocol, models: form.models, apiKey: form.apiKey || null }
        await invokeDesktop('update_provider', { id: form.id, payload })
        setMsg('Đã cập nhật provider')
      }
      setForm(f => ({ ...f, apiKey: '' }))
      await load()
    } catch (e) { setErr(String(e)) } finally { setBusy(false) }
  }

  const handleFetch = async () => {
    if (!form.id.trim()) { setErr('Chưa có Provider ID'); return }
    setBusy(true); setErr(''); setMsg('')
    try {
      const models = await invokeDesktop('fetch_provider_models', { id: form.id })
      const merged = Array.from(new Set([...form.models, ...models]))
      setForm(f => ({ ...f, models: merged }))
      setMsg(`Đã fetch ${models.length} models`)
    } catch (e) { setErr(String(e)) } finally { setBusy(false) }
  }

  const addModel = () => {
    const m = modelInput.trim()
    if (!m) return
    if (form.models.includes(m)) { setModelInput(''); return }
    setForm(f => ({ ...f, models: [...f.models, m] })); setModelInput('')
  }
  const removeModel = (m) => setForm(f => ({ ...f, models: f.models.filter(x => x !== m) }))

  return <div style={{display:'flex', flexDirection:'column', gap:14}}>
    {err && <div className="error-box">{err}</div>}
    {msg && <div className="desktop-notice" style={{background:'#eef7ee', borderColor:'#cde9cd', color:'#2e6b2e'}}><CircleCheck size={18}/><span>{msg}</span></div>}
    <div className="panel" style={{padding:16, display:'flex', flexDirection:'column', gap:12}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:8}}><strong style={{fontSize:13}}>{form.displayName || form.id || 'Custom provider'}</strong><span style={{fontSize:10, background:'#f0eefc', color:'#6558d6', padding:'2px 7px', borderRadius:10, fontWeight:700}}>Custom</span><span style={{width:8, height:8, borderRadius:8, background: hasApiKey ? '#4caf50' : '#ccc', display:'inline-block'}}/></div>
        <div style={{display:'flex', gap:6}}>
          <button className="outline" onClick={()=>{ setIsEditing(!isEditing); setErr(''); setMsg('') }} disabled={!desktop || busy} style={{height:32, fontSize:11}}>{isEditing ? 'Edit' : 'Create'}</button>
          <button className="outline" onClick={async()=>{ if(!window.confirm('Xóa provider này?')) return; try{ await invokeDesktop('delete_provider',{id:form.id}); setMsg('Đã xóa'); await load() }catch(e){setErr(String(e))} }} disabled={!desktop || busy || providers.length<=1} title={providers.length<=1 ? 'MVP chỉ có 1 provider, không thể xóa' : ''} style={{height:32, fontSize:11, color: providers.length<=1 ? '#aaa' : '#b55041', borderColor: providers.length<=1 ? '#eee' : '#f6d4cd'}}>Delete</button>
        </div>
      </div>
      <div style={{height:1, background:'#eee'}}/>
      <div style={{display:'flex', flexDirection:'column', gap:10}}>
        <div>
          <label style={{fontSize:11, fontWeight:700}}>Provider ID</label>
          <input value={form.id} onChange={e=>setForm(f=>({...f, id:e.target.value}))} disabled={isEditing || busy} placeholder="acme-gateway" style={{width:'100%', height:36, border:'1px solid #e2e1e7', borderRadius:8, padding:'0 12px', marginTop:6, fontSize:12, background: isEditing ? '#f9fafb' : '#fff'}}/>
          <div style={{fontSize:10, color:'#777', marginTop:4}}>Lowercase identifier, starting with a letter, that uniquely names this provider in requests and as its credential name.</div>
        </div>
        <div>
          <label style={{fontSize:11, fontWeight:700}}>Display name</label>
          <input value={form.displayName} onChange={e=>setForm(f=>({...f, displayName:e.target.value}))} disabled={busy} placeholder="Display name" style={{width:'100%', height:36, border:'1px solid #e2e1e7', borderRadius:8, padding:'0 12px', marginTop:6, fontSize:12}}/>
        </div>
        <div>
          <label style={{fontSize:11, fontWeight:700}}>Base URL</label>
          <input value={form.baseUrl} onChange={e=>setForm(f=>({...f, baseUrl:e.target.value}))} disabled={busy} placeholder="https://gateway.example/v1" style={{width:'100%', height:36, border:'1px solid #e2e1e7', borderRadius:8, padding:'0 12px', marginTop:6, fontSize:12}}/>
        </div>
        <div>
          <label style={{fontSize:11, fontWeight:700}}>API protocol</label>
          <select value={form.protocol} onChange={e=>setForm(f=>({...f, protocol:e.target.value}))} disabled={busy} style={{width:'100%', height:36, border:'1px solid #e2e1e7', borderRadius:8, padding:'0 8px', marginTop:6, fontSize:12}}>
            <option value="openai-completions">openai-completions</option>
            <option value="openai-responses" disabled>openai-responses (MVP chưa hỗ trợ)</option>
            <option value="anthropic-messages" disabled>anthropic-messages (MVP chưa hỗ trợ)</option>
          </select>
        </div>
        <div>
          <label style={{fontSize:11, fontWeight:700}}>API key</label>
          <input type="password" value={form.apiKey} onChange={e=>setForm(f=>({...f, apiKey:e.target.value}))} disabled={busy} placeholder={hasApiKey ? 'Đã lưu ●●●● — nhập mới để ghi đè' : 'Enter your API key'} style={{width:'100%', height:36, border:'1px solid #e2e1e7', borderRadius:8, padding:'0 12px', marginTop:6, fontSize:12}}/>
        </div>
        <div style={{height:1, background:'#eee', margin:'6px 0'}}/>
        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <label style={{fontSize:11, fontWeight:700}}>Models</label>
            <button className="outline" onClick={handleFetch} disabled={!desktop || busy} style={{height:28, fontSize:11}}><RefreshCw size={12}/> Fetch available models</button>
          </div>
          <div style={{border:'1px dashed #e2e1e7', borderRadius:8, padding:12, marginTop:6, textAlign:'center', fontSize:11, color:'#777', background:'#fafafa'}}>
            {form.models.length ? <div style={{display:'flex', flexWrap:'wrap', gap:6, justifyContent:'flex-start'}}>{form.models.map(m=> <span key={m} style={{background:'#fff', border:'1px solid #e2e1e7', borderRadius:16, padding:'4px 10px', fontSize:11, display:'flex', alignItems:'center', gap:6}}>{m} <button onClick={()=>removeModel(m)} style={{border:0, background:'transparent', cursor:'pointer', padding:0}}><X size={12}/></button></span>)}</div> : 'No models will be shown in the selector. Unlisted IDs still be sent directly.'}
          </div>
          <div style={{display:'flex', gap:8, marginTop:8}}>
            <input value={modelInput} onChange={e=>setModelInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){e.preventDefault(); addModel()} }} disabled={busy} placeholder="model-id, ví dụ xoay-vong-worker-web-128k" style={{flex:1, height:32, border:'1px solid #e2e1e7', borderRadius:8, padding:'0 12px', fontSize:12}}/>
            <button className="outline" onClick={addModel} disabled={busy || !modelInput.trim()} style={{height:32, fontSize:11}}>Add model</button>
          </div>
        </div>
      </div>
      <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:6}}>
        <button className="outline" onClick={()=>{ setErr(''); setMsg(''); load() }} disabled={busy} style={{height:36}}>Cancel</button>
        <button className="primary" onClick={handleSave} disabled={!desktop || busy} style={{height:36}}><WandSparkles size={14}/> {isEditing ? 'Update provider' : 'Create provider'}</button>
      </div>
    </div>
  </div>
}

function SettingsPage() {
  const desktop = isDesktop()
  const [fbInput, setFbInput] = useState('')
  const [aiProviderInput, setAiProviderInput] = useState('')
  const [status, setStatus] = useState({ hasFacebookToken: false, hasAiProviderKey: false })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [showPublish, setShowPublish] = useState(false)

  const refresh = async () => {
    if (!desktop) return
    try {
      const s = await invokeDesktop('credential_status')
      setStatus(s)
    } catch (e) { setErr(String(e)) }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [pages, setPages] = useState([])
  const [subTab, setSubTab] = useState('Providers')
  const saveFb = async () => {
    if (!fbInput.trim()) { setErr('Vui lòng nhập Facebook Token'); return }
    setBusy(true); setErr(''); setMsg('')
    try { await invokeDesktop('set_facebook_token', { token: fbInput }); setFbInput(''); await refresh(); setMsg('Đã lưu Facebook Token vào kho bảo mật OS') }
    catch (e) { setErr(String(e)) } finally { setBusy(false) }
  }
  const deleteFb = async () => {
    if (!window.confirm('Xóa Facebook Token khỏi kho bảo mật?')) return
    setBusy(true); setErr(''); setMsg('')
    try { await invokeDesktop('delete_facebook_token'); await refresh(); setPages([]); setMsg('Đã xóa Facebook Token') }
    catch (e) { setErr(String(e)) } finally { setBusy(false) }
  }
  const checkFb = async () => {
    if (!fbInput.trim() && !status.hasFacebookToken) { setErr('Vui lòng nhập token hoặc lưu trước khi kiểm tra'); return }
    // For now, require input to validate
    if (!fbInput.trim()) { setErr('Vui lòng dán token vào ô trên để kiểm tra'); return }
    setBusy(true); setErr(''); setMsg('')
    try {
      const me = await invokeDesktop('validate_facebook_token', { token: fbInput })
      setMsg(`Token hợp lệ: ${me.name} (ID: ${me.id})`)
    } catch (e) { setErr(String(e)) } finally { setBusy(false) }
  }
  const loadPages = async () => {
    if (!fbInput.trim()) { setErr('Vui lòng nhập User Token để tải danh sách Trang'); return }
    setBusy(true); setErr(''); setMsg('')
    try {
      const list = await invokeDesktop('list_facebook_pages', { token: fbInput })
      setPages(list)
      setMsg(`Đã tải ${list.length} Trang, token Page đã cache an toàn (không hiện)`)
    } catch (e) { setErr(String(e)) } finally { setBusy(false) }
  }
  const saveAiProvider = async () => {
    if (!aiProviderInput.trim()) { setErr('Vui lòng nhập OpenAI Compatible Provider API Key'); return }
    setBusy(true); setErr(''); setMsg('')
    try { await invokeDesktop('set_ai_provider_key', { key: aiProviderInput }); setAiProviderInput(''); await refresh(); setMsg('Đã lưu OpenAI Compatible Provider Key') }
    catch (e) { setErr(String(e)) } finally { setBusy(false) }
  }
  const deleteAiProvider = async () => {
    if (!window.confirm('Xóa OpenAI Compatible Provider Key khỏi kho bảo mật?')) return
    setBusy(true); setErr(''); setMsg('')
    try { await invokeDesktop('delete_ai_provider_key'); await refresh(); setMsg('Đã xóa OpenAI Compatible Provider Key') }
    catch (e) { setErr(String(e)) } finally { setBusy(false) }
  }

  return <section className="media-page">
    <div className="page-heading"><div><p>BẢO MẬT CỤC BỘ</p><h1>Cài đặt</h1><span>Token và API key được lưu trong Credential Manager / Keychain của hệ điều hành, không bao giờ lưu trong frontend hay file JSON.</span></div></div>
    {!desktop && <div className="desktop-notice"><HardDrive size={23}/><div><strong>Hãy mở bằng ứng dụng FlowPost AI Desktop</strong><span>Chức năng bảo mật chỉ hoạt động trong bản Tauri.</span></div></div>}
    {err && <div className="error-box">{err}</div>}
    {msg && <div className="desktop-notice" style={{background:'#eef7ee', borderColor:'#cde9cd', color:'#2e6b2e'}}><CircleCheck size={18}/><span>{msg}</span></div>}
    <div style={{display:'flex', gap:8, marginBottom:14}}>
      <button className={subTab==='Kết nối'?'primary':'outline'} onClick={()=>setSubTab('Kết nối')} style={{height:32}}><HardDrive size={14}/> Kết nối</button>
      <button className={subTab==='Providers'?'primary':'outline'} onClick={()=>setSubTab('Providers')} style={{height:32}}><WandSparkles size={14}/> Providers</button>
    </div>
    {subTab==='Kết nối' ? <div className="panel" style={{padding:20, display:'flex', flexDirection:'column', gap:18}}>
      <div>
        <h2 style={{fontSize:14, margin:'0 0 8px'}}>Facebook Token</h2>
        <p style={{fontSize:11, color:'#777', margin:'0 0 10px'}}>Dùng cho Graph API đăng bài. Token được mã hóa trong OS vault. Frontend chỉ biết trạng thái <b>{status.hasFacebookToken ? '●●●● đã lưu' : 'chưa lưu'}</b>.</p>
        <div style={{display:'flex', gap:8}}>
          <input type="password" placeholder={status.hasFacebookToken ? 'Đã lưu ●●●● — nhập mới để ghi đè' : 'Nhập Facebook User/Page Access Token'} value={fbInput} onChange={e=>setFbInput(e.target.value)} disabled={!desktop || busy} style={{flex:1, height:36, border:'1px solid #e2e1e7', borderRadius:8, padding:'0 12px', fontSize:12}}/>
          <button className="primary" onClick={saveFb} disabled={!desktop || busy} style={{height:36}}><Zap size={14}/> Lưu</button>
          <button className="outline" onClick={checkFb} disabled={!desktop || busy} style={{height:36}}><Search size={14}/> Kiểm tra</button>
          <button className="outline" onClick={loadPages} disabled={!desktop || busy} style={{height:36}}><FileText size={14}/> Tải Trang</button>
          <button className="outline" onClick={()=>setShowPublish(true)} disabled={!desktop || busy || pages.length===0} style={{height:36}}><Send size={14}/> Đăng bài</button>
          <button className="outline" onClick={deleteFb} disabled={!desktop || busy || !status.hasFacebookToken} style={{height:36}}><Trash2 size={14}/> Xóa</button>
        </div>
        {pages.length > 0 && <div className="panel" style={{marginTop:10, padding:10, background:'#f9fafb'}}>
          <div style={{fontSize:11, fontWeight:700, marginBottom:6}}>Danh sách Trang ({pages.length}) — Page Token đã cache, không hiện:</div>
          {pages.map(p => <div key={p.id} style={{display:'flex', justifyContent:'space-between', padding:'6px 8px', background:'#fff', border:'1px solid #eee', borderRadius:6, marginBottom:4}}><span style={{fontSize:11}}><b>{p.name}</b> <span style={{color:'#777'}}>({p.id})</span></span><span style={{fontSize:10, color:'#2e7d32'}}>● token cached</span></div>)}
        </div>}
      </div>
      <div style={{height:1, background:'#eee'}}/>
      <div>
        <h2 style={{fontSize:14, margin:'0 0 8px'}}>OpenAI Compatible Provider API Key (Legacy)</h2>
        <p style={{fontSize:11, color:'#777', margin:'0 0 10px'}}>Legacy single-key. Đã chuyển sang tab Providers — vui lòng dùng Providers để cấu hình Base URL, Model, Protocol.</p>
        <div style={{display:'flex', gap:8}}>
          <input type="password" placeholder={status.hasAiProviderKey ? 'Đã lưu ●●●● — nhập mới để ghi đè' : 'Nhập OpenAI Compatible Provider API Key'} value={aiProviderInput} onChange={e=>setAiProviderInput(e.target.value)} disabled={!desktop || busy} style={{flex:1, height:36, border:'1px solid #e2e1e7', borderRadius:8, padding:'0 12px', fontSize:12}}/>
          <button className="primary" onClick={saveAiProvider} disabled={!desktop || busy} style={{height:36}}><WandSparkles size={14}/> Lưu</button>
          <button className="outline" onClick={deleteAiProvider} disabled={!desktop || busy || !status.hasAiProviderKey} style={{height:36}}><Trash2 size={14}/> Xóa</button>
        </div>
      </div>
      <div style={{background:'#f7f6fe', border:'1px solid #eceafa', borderRadius:8, padding:12, fontSize:11, color:'#5e58a6'}}>
        <strong style={{display:'flex', alignItems:'center', gap:6}}><HardDrive size={14}/> Lưu trữ: </strong>
        <span>Windows Credential Manager / macOS Keychain / Linux Secret Service — fallback file <code>secure-credentials.json</code> trong AppData (atomic write). Không bao giờ ghi vào <code>media-index.json</code> hay localStorage.</span>
      </div>
    </div> : <ProvidersPanel />}
    {showPublish && <PublishModal onClose={()=>setShowPublish(false)} onSuccess={()=>{}} />}
  </section>
}

function SettingsStatus() {
  const [status, setStatus] = useState({ hasFacebookToken: false, hasAiProviderKey: false })
  const desktop = isDesktop()
  useEffect(() => {
    if (!desktop) return
    const load = async () => {
      try {
        const s = await invokeDesktop('credential_status')
        let hasAi = s.hasAiProviderKey
        try { const active = await invokeDesktop('get_active_provider'); hasAi = hasAi || !!active.hasApiKey } catch {}
        setStatus({ hasFacebookToken: s.hasFacebookToken, hasAiProviderKey: hasAi })
      } catch {}
    }
    load()
    const id = setInterval(load, 4000)
    return () => clearInterval(id)
  }, [desktop])
  const hasAny = status.hasFacebookToken || status.hasAiProviderKey
  return <div className="token-box"><div className="token-title"><span><Zap size={14}/> Bảo mật</span><b style={{color: hasAny ? '#2e7d32' : '#d87642'}}>{hasAny ? 'Đã lưu' : 'Chưa lưu'}</b></div><div className="progress"><i style={{width: status.hasFacebookToken && status.hasAiProviderKey ? '100%' : status.hasFacebookToken || status.hasAiProviderKey ? '50%' : '0%', background: hasAny ? '#4caf50' : '#e4a263'}}/></div><p>{status.hasFacebookToken ? 'FB Token ●●●●' : 'FB Token chưa lưu'} • {status.hasAiProviderKey ? 'AI Provider ●●●●' : 'AI Provider chưa lưu'}</p></div>
}

function AiContentPage() {
  const desktop = isDesktop()
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('Viral')
  const [customStyle, setCustomStyle] = useState('')
  const [length, setLength] = useState('Vừa')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [mediaIds, setMediaIds] = useState([])
  const [mediaOptions, setMediaOptions] = useState([])
  const [showPicker, setShowPicker] = useState(false)

  const loadMediaOptions = async () => {
    if (!desktop) return
    try {
      const list = await invokeDesktop('list_media')
      const withUrls = await Promise.all(list.map(async item => ({ ...item, url: await localAssetUrl(item.path) })))
      setMediaOptions(withUrls)
    } catch (e) { setErr(String(e)) }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (showPicker) loadMediaOptions() }, [showPicker]) // eslint-disable-line react-hooks/exhaustive-deps

  const generate = async () => {
    if (!prompt.trim()) { setErr('Vui lòng nhập prompt'); return }
    setBusy(true); setErr(''); setMsg('')
    try {
      const res = await invokeDesktop('generate_content', { payload: { prompt, style, customStyle: customStyle || null, length } })
      setTitle(res.title || '')
      setBody(res.body || '')
      setMsg(res.isMock ? 'Đã tạo nội dung mock (demo Kho)' : 'Đã tạo nội dung')
    } catch (e) { setErr(String(e)) } finally { setBusy(false) }
  }

  const save = async () => {
    if (!title.trim() && !body.trim()) { setErr('Tiêu đề hoặc nội dung không được để trống'); return }
    if (!prompt.trim()) { setErr('Prompt không được để trống'); return }
    setBusy(true); setErr(''); setMsg('')
    try {
      await invokeDesktop('save_content', { payload: { title, body, prompt, style, customStyle: customStyle || null, mediaIds } })
      setMsg('Đã lưu vào Kho nội dung')
      setPrompt(''); setTitle(''); setBody(''); setMediaIds([])
    } catch (e) { setErr(String(e)) } finally { setBusy(false) }
  }

  const toggleMedia = (id) => setMediaIds(prev => prev.includes(id) ? prev.filter(x => x!==id) : [...prev, id])

  return <section className="media-page">
    <div className="page-heading"><div><p>AI CONTENT</p><h1>Tạo nội dung với AI</h1><span>Nhập prompt, chọn style, tạo mock để demo Kho trước khi nối OpenAI Compatible Provider thật.</span></div></div>
    {!desktop && <div className="desktop-notice"><HardDrive size={23}/><div><strong>Hãy mở bằng ứng dụng FlowPost AI Desktop</strong><span>Chức năng AI chỉ hoạt động trong bản Tauri.</span></div></div>}
    {err && <div className="error-box">{err}</div>}
    {msg && <div className="desktop-notice" style={{background:'#eef7ee', borderColor:'#cde9cd', color:'#2e6b2e'}}><CircleCheck size={18}/><span>{msg}</span></div>}
    <div className="panel" style={{padding:20, display:'flex', flexDirection:'column', gap:16}}>
      <div>
        <label style={{fontSize:12, fontWeight:700}}>Prompt *</label>
        <textarea placeholder="VD: Bí quyết năng lượng buổi sáng cho dân văn phòng..." value={prompt} onChange={e=>setPrompt(e.target.value)} maxLength={500} disabled={!desktop || busy} style={{width:'100%', minHeight:90, border:'1px solid #e2e1e7', borderRadius:8, padding:12, fontSize:12, marginTop:6, resize:'vertical'}}/>
        <div style={{fontSize:10, color:'#999', textAlign:'right'}}>{prompt.length}/500</div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12}}>
        <div>
          <label style={{fontSize:12, fontWeight:700}}>Style</label>
          <select value={style} onChange={e=>setStyle(e.target.value)} disabled={busy} style={{width:'100%', height:36, border:'1px solid #e2e1e7', borderRadius:8, padding:'0 8px', marginTop:6}}>
            <option>Viral</option><option>Motivational</option><option>Story</option><option>Custom</option>
          </select>
        </div>
        <div>
          <label style={{fontSize:12, fontWeight:700}}>Độ dài</label>
          <select value={length} onChange={e=>setLength(e.target.value)} disabled={busy} style={{width:'100%', height:36, border:'1px solid #e2e1e7', borderRadius:8, padding:'0 8px', marginTop:6}}>
            <option>Ngắn</option><option>Vừa</option><option>Dài</option>
          </select>
        </div>
        <div style={{display:'flex', alignItems:'flex-end'}}>
          <button className="primary" onClick={generate} disabled={!desktop || busy || !prompt.trim()} style={{width:'100%', height:36, justifyContent:'center'}}><Sparkles size={16}/> {busy ? 'Đang tạo...' : 'Tạo nội dung'}</button>
        </div>
      </div>
      {style === 'Custom' && <div>
        <label style={{fontSize:12, fontWeight:700}}>Custom style</label>
        <input placeholder="VD: Hài hước GenZ, Trang trọng..." value={customStyle} onChange={e=>setCustomStyle(e.target.value)} disabled={busy} style={{width:'100%', height:36, border:'1px solid #e2e1e7', borderRadius:8, padding:'0 12px', marginTop:6, fontSize:12}}/>
      </div>}
      <div style={{height:1, background:'#eee'}}/>
      <div>
        <label style={{fontSize:12, fontWeight:700}}>Tiêu đề</label>
        <input placeholder="Tiêu đề sẽ hiện sau khi Tạo..." value={title} onChange={e=>setTitle(e.target.value)} disabled={busy} style={{width:'100%', height:36, border:'1px solid #e2e1e7', borderRadius:8, padding:'0 12px', marginTop:6, fontSize:12}}/>
      </div>
      <div>
        <label style={{fontSize:12, fontWeight:700}}>Nội dung</label>
        <textarea placeholder="Nội dung sẽ hiện sau khi Tạo — bạn có thể chỉnh sửa..." value={body} onChange={e=>setBody(e.target.value)} disabled={busy} style={{width:'100%', minHeight:160, border:'1px solid #e2e1e7', borderRadius:8, padding:12, marginTop:6, fontSize:12, resize:'vertical'}}/>
      </div>
      <div>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <label style={{fontSize:12, fontWeight:700}}>Gắn media ({mediaIds.length})</label>
          <button className="outline" onClick={()=>setShowPicker(!showPicker)} disabled={!desktop} style={{height:32}}><Images size={14}/> {showPicker ? 'Ẩn' : 'Chọn'} media</button>
        </div>
        {showPicker && <div className="media-grid" style={{marginTop:10, gridTemplateColumns:'repeat(3,1fr)'}}>{mediaOptions.length ? mediaOptions.map(m => <article key={m.id} className="media-card" style={{border: mediaIds.includes(m.id) ? '2px solid #6558d6' : '1px solid #e8e8ed', cursor:'pointer'}} onClick={()=>toggleMedia(m.id)}><div className="media-preview" style={{aspectRatio:1}}>{m.mediaType==='image'?<img src={m.url} alt={m.name}/>:<><video src={m.url}/><div className="video-badge"><Film size={12}/> VIDEO</div></>}</div><div className="media-info" style={{padding:8}}><strong style={{fontSize:11}}>{m.name}</strong><span style={{fontSize:10}}>{mediaIds.includes(m.id) ? '✓ Đã chọn' : m.extension.toUpperCase()}</span></div></article>) : <span style={{fontSize:11, color:'#777'}}>Thư viện trống — hãy nhập media trước</span>}</div>}
        {mediaIds.length>0 && <div style={{fontSize:11, color:'#6558d6', marginTop:6}}>Đã chọn {mediaIds.length} media</div>}
      </div>
      <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
        <button className="outline" onClick={()=>{setPrompt(''); setTitle(''); setBody(''); setMediaIds([]); setMsg(''); setErr('')}} disabled={busy} style={{height:36}}>Xóa form</button>
        <button className="primary" onClick={save} disabled={!desktop || busy} style={{height:36}}><FileText size={16}/> Lưu vào kho</button>
      </div>
      <div style={{background:'#fff7e6', border:'1px solid #ffe4b5', borderRadius:8, padding:10, fontSize:11, color:'#8a6d00'}}>Mock demo: Chưa nối OpenAI Compatible Provider thật. Khi bạn lưu OpenAI Compatible Provider Key ở Cài đặt, bản mock vẫn dùng để demo Kho — API thật sẽ được thay thế sau mà không đổi kho.</div>
    </div>
  </section>
}

function ScheduleModal({ contentId, onClose, onCreated }) {
  const [scheduledAt, setScheduledAt] = useState('')
  const [platform, setPlatform] = useState('Sống Tích Cực')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [warn, setWarn] = useState('')

  const checkConflict = async () => {
    if (!scheduledAt || !platform) return ''
    try {
      const list = await invokeDesktop('list_schedule')
      const target = new Date(scheduledAt).getTime()
      const conflict = list.find(s => s.platform === platform && s.status === 'Scheduled' && Math.abs(new Date(s.scheduledAt).getTime() - target) < 30*60*1000)
      if (conflict) return `Cảnh báo: Trùng lịch với "${conflict.platform}" lúc ${new Date(conflict.scheduledAt).toLocaleString('vi-VN')} (cách <30 phút). Bạn có thể vẫn đăng trùng nếu chấp nhận.`
      return ''
    } catch { return '' }
  }

  const handleSchedule = async (ignoreWarn) => {
    if (!contentId) { setErr('Thiếu contentId'); return }
    if (!scheduledAt) { setErr('Vui lòng chọn thời gian'); return }
    if (!ignoreWarn) {
      const w = await checkConflict()
      if (w) { setWarn(w); return }
    }
    setBusy(true); setErr(''); setWarn('')
    try {
      const iso = new Date(scheduledAt).toISOString()
      await invokeDesktop('create_schedule', { payload: { contentId, scheduledAt: iso, platform, pages: [platform] } })
      onCreated && onCreated()
      onClose()
    } catch (e) { setErr(String(e)) } finally { setBusy(false) }
  }

  return <div style={{position:'fixed', inset:0, background:'#0006', display:'grid', placeItems:'center', zIndex:50}} onClick={onClose}>
    <div className="panel" style={{width:420, padding:18, display:'flex', flexDirection:'column', gap:12}} onClick={e=>e.stopPropagation()}>
      <h2 style={{margin:0, fontSize:16}}>Lên lịch đăng</h2>
      <div>
        <label style={{fontSize:12, fontWeight:700}}>Thời gian</label>
        <input type="datetime-local" value={scheduledAt} onChange={e=>{setScheduledAt(e.target.value); setWarn('')}} style={{width:'100%', height:36, border:'1px solid #e2e1e7', borderRadius:8, padding:'0 8px', marginTop:6}}/>
        <div style={{fontSize:10, color:'#888', marginTop:4}}>Phải trong tương lai, tối thiểu 5 phút.</div>
      </div>
      <div>
        <label style={{fontSize:12, fontWeight:700}}>Nền tảng</label>
        <select value={platform} onChange={e=>setPlatform(e.target.value)} style={{width:'100%', height:36, border:'1px solid #e2e1e7', borderRadius:8, padding:'0 8px', marginTop:6}}>
          <option>Sống Tích Cực</option><option>Daily Motivation</option><option>Chill Mỗi Ngày</option>
        </select>
      </div>
      {warn && <div className="error-box" style={{background:'#fff3cd', borderColor:'#ffc107', color:'#664d03'}}>{warn}<div style={{marginTop:8, display:'flex', gap:8}}><button className="outline" onClick={()=>setWarn('')} style={{height:30}}>Hủy</button><button className="primary" onClick={()=>handleSchedule(true)} style={{height:30}}>Vẫn đăng trùng</button></div></div>}
      {err && <div className="error-box">{err}</div>}
      <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
        <button className="outline" onClick={onClose} disabled={busy} style={{height:36}}>Đóng</button>
        <button className="primary" onClick={()=>handleSchedule(false)} disabled={busy} style={{height:36}}><CalendarDays size={14}/> Xác nhận</button>
      </div>
    </div>
  </div>
}

function PublishModal({ onClose, onSuccess }) {
  const [pages, setPages] = useState([])
  const [pageId, setPageId] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  // Load pages when modal opens (use empty token → backend lấy từ keyring)
  useEffect(() => {
    invokeDesktop('list_facebook_pages', { token: '' })
      .then(setPages)
      .catch(e => setErr(String(e)))
  }, [])

  const handlePublish = async () => {
    if (!pageId || !message.trim()) return
    setBusy(true); setErr(''); setMsg('')
    try {
      const res = await invokeDesktop('publish_content', { page_id: pageId, message, image_path: null })
      setMsg(`Đã đăng thành công (post ID: ${res.id || 'unknown'})`)
      onSuccess && onSuccess()
      setTimeout(onClose, 1500)
    } catch (e) { setErr(String(e)) } finally { setBusy(false) }
  }

  return (
    <div style={{position:'fixed', inset:0, background:'#0008', display:'grid', placeItems:'center', zIndex:60}} onClick={onClose}>
      <div className="panel" style={{width:440, padding:24, display:'flex', flexDirection:'column', gap:16}} onClick={e=>e.stopPropagation()}>
        <h2 style={{margin:0, fontSize:18}}>Đăng bài ngay</h2>
        {pages.length === 0 && <p style={{fontSize:12, color:'#666'}}>Chưa có Trang nào. Hãy bấm "Tải Trang" ở Cài đặt để tải danh sách.</p>}
        <select value={pageId} onChange={e=>setPageId(e.target.value)} disabled={busy}>
          <option value="">-- Chọn Trang --</option>
          {pages.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
        </select>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Nội dung bài đăng..." disabled={busy} style={{width:'100%', minHeight:100, border:'1px solid #e2e1e7', borderRadius:8, padding:12, marginTop:8, fontSize:12, resize:'vertical'}} />
        {err && <div className="error-box" style={{marginTop:8}}>{err}</div>}
        {msg && <div className="desktop-notice" style={{background:'#eef7ee', borderColor:'#cde9cd', color:'#2e6b2e', marginTop:8, padding:8}}><CircleCheck size={14}/><span>{msg}</span></div>}
        <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
          <button className="outline" onClick={onClose} disabled={busy} style={{height:36}}><X size={14}/> Đóng</button>
          <button className="primary" onClick={handlePublish} disabled={busy || !pageId || !message.trim()} style={{height:36}}><Send size={14}/> Đăng ngay</button>
        </div>
      </div>
    </div>
  )
}

function ContentWarehousePage() {
  const desktop = isDesktop()
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('Tất cả')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [scheduleFor, setScheduleFor] = useState(null)

  const refresh = async () => {
    if (!desktop) return
    setBusy(true)
    try {
      const list = await invokeDesktop('list_content')
      setItems(list)
      setErr('')
    } catch (e) { setErr(String(e)) } finally { setBusy(false) }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (id) => {
    if (!window.confirm('Xóa nội dung này?')) return
    try { await invokeDesktop('delete_content', { id }); await refresh() } catch (e) { setErr(String(e)) }
  }
  const approve = async (id) => {
    try { await invokeDesktop('update_content_status', { id, status: 'Approved' }); await refresh() } catch (e) { setErr(String(e)) }
  }

  const filtered = items.filter(it => {
    if (filter !== 'Tất cả' && it.status !== filter) return false
    if (query && !`${it.title} ${it.body} ${it.prompt}`.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  const formatDate = (iso) => {
    try { return new Intl.DateTimeFormat('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}).format(new Date(iso)) } catch { return iso }
  }

  return <section className="media-page">
    <div className="page-heading"><div><p>KHO NỘI DUNG</p><h1>Kho nội dung</h1><span>Lưu trữ nội dung đã tạo, gắn media, duyệt và chuẩn bị lịch đăng.</span></div><div className="media-actions"><button className="outline" onClick={refresh} disabled={!desktop || busy}><RefreshCw size={16}/> Làm mới</button></div></div>
    {!desktop && <div className="desktop-notice"><HardDrive size={23}/><div><strong>Hãy mở bằng ứng dụng FlowPost AI Desktop</strong><span>Chỉ bản Tauri mới đọc được kho cục bộ.</span></div></div>}
    {err && <div className="error-box">{err}</div>}
    <div className="media-summary" style={{flexWrap:'wrap'}}>
      <div><FileText size={18}/><span><b>{items.length}</b> tổng</span></div>
      <div><CircleCheck size={18}/><span><b>{items.filter(i=>i.status==='Draft').length}</b> nháp</span></div>
      <div><Zap size={18}/><span><b>{items.filter(i=>i.status==='Approved').length}</b> đã duyệt</span></div>
      <div style={{flex:1, minWidth:160}}><Search size={14}/><input placeholder="Tìm theo tiêu đề, prompt..." value={query} onChange={e=>setQuery(e.target.value)} style={{border:0, outline:0, background:'transparent', flex:1, fontSize:12, width:'100%'}}/></div>
    </div>
    <div style={{display:'flex', gap:8, marginBottom:14}}>
      {['Tất cả','Draft','Approved','Archived'].map(f => <button key={f} onClick={()=>setFilter(f)} className={filter===f ? 'primary' : 'outline'} style={{height:32, fontSize:12}}>{f}</button>)}
    </div>
    {filtered.length ? <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14}}>{filtered.map(it => <article key={it.id} className="panel" style={{padding:14, display:'flex', flexDirection:'column', gap:8}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <span style={{fontSize:10, fontWeight:800, color: it.style==='Custom' ? '#d87642' : '#6558d6', background: it.style==='Custom' ? '#fff0e6' : '#f0eefc', padding:'3px 7px', borderRadius:10}}>{it.style}{it.customStyle ? `:${it.customStyle}` : ''}</span>
        <span style={{fontSize:10, color: it.status==='Approved' ? '#2e7d32' : '#777', background: it.status==='Approved' ? '#e8f5e9' : '#f5f5f5', padding:'3px 7px', borderRadius:10}}>{it.status}</span>
      </div>
      <strong style={{fontSize:13, lineHeight:1.4}}>{it.title}</strong>
      <span style={{fontSize:11, color:'#555', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{it.body}</span>
      <span style={{fontSize:10, color:'#888'}}>Prompt: {it.prompt} • {formatDate(it.createdAt)} • {it.mediaIds?.length || 0} media</span>
      <div style={{display:'flex', gap:8, marginTop:4, flexWrap:'wrap'}}>
        <button className="outline" onClick={()=>approve(it.id)} disabled={it.status==='Approved' || busy} style={{height:30, fontSize:11}}><CircleCheck size={12}/> Duyệt</button>
        <button className="primary" onClick={()=>setScheduleFor(it.id)} disabled={it.status!=='Approved' || busy} title={it.status!=='Approved' ? 'Hãy duyệt trước' : ''} style={{height:30, fontSize:11}}><CalendarDays size={12}/> Lên lịch</button>
        <button className="outline" onClick={()=>remove(it.id)} disabled={busy} style={{height:30, fontSize:11}}><Trash2 size={12}/> Xóa</button>
      </div>
    </article>)}</div> : <div className="media-empty"><div><FileText size={34}/></div><h2>{items.length===0 ? 'Kho nội dung đang trống' : 'Không có kết quả'}</h2><p>{items.length===0 ? 'Hãy tạo nội dung ở AI Content và Lưu vào kho.' : 'Thử đổi bộ lọc hoặc từ khóa.'}</p></div>}
    {scheduleFor && <ScheduleModal contentId={scheduleFor} onClose={()=>setScheduleFor(null)} onCreated={refresh} />}
  </section>
}

function SchedulePage() {
  const desktop = isDesktop()
  const [schedules, setSchedules] = useState([])
  const [contents, setContents] = useState([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [month, setMonth] = useState(() => { const d=new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [tab, setTab] = useState('Calendar')

  const refresh = async () => {
    if (!desktop) return
    setBusy(true)
    try {
      const [s, c] = await Promise.all([invokeDesktop('list_schedule'), invokeDesktop('list_content')])
      setSchedules(s); setContents(c); setErr('')
    } catch (e) { setErr(String(e)) } finally { setBusy(false) }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!desktop) return
    const id = setInterval(refresh, 4000)
    return () => clearInterval(id)
  }, [desktop]) // eslint-disable-line react-hooks/exhaustive-deps

  const deleteItem = async (id) => {
    if (!window.confirm('Xóa lịch này?')) return
    try { await invokeDesktop('delete_schedule', { id }); await refresh() } catch (e) { setErr(String(e)) }
  }

  const contentMap = new Map(contents.map(c => [c.id, c]))

  const daysInMonth = () => {
    const y = month.getFullYear(), m = month.getMonth()
    const firstDay = new Date(y, m, 1).getDay() // 0 Sun
    const startOffset = (firstDay + 6) % 7 // Mon=0
    const days = new Date(y, m+1, 0).getDate()
    const cells = []
    for (let i=0;i<startOffset;i++) cells.push(null)
    for (let d=1; d<=days; d++) cells.push(new Date(y, m, d))
    return cells
  }
  const cells = daysInMonth()
  const isToday = (d) => { if(!d) return false; const t=new Date(); return d.getDate()===t.getDate() && d.getMonth()===t.getMonth() && d.getFullYear()===t.getFullYear() }
  const schedulesForDay = (d) => {
    if (!d) return []
    return schedules.filter(s => {
      const sd = new Date(s.scheduledAt)
      return sd.getDate()===d.getDate() && sd.getMonth()===d.getMonth() && sd.getFullYear()===d.getFullYear()
    })
  }

  const formatTime = (iso) => new Intl.DateTimeFormat('vi-VN', { hour:'2-digit', minute:'2-digit'}).format(new Date(iso))
  const formatFull = (iso) => new Intl.DateTimeFormat('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}).format(new Date(iso))

  return <section className="media-page">
    <div className="page-heading"><div><p>LỊCH NỘI DUNG</p><h1>Lịch nội dung</h1><span>Lịch đăng theo tháng và hàng đợi · Cảnh báo trùng &lt;30 phút nhưng cho phép đăng trùng nếu chấp nhận.</span></div><div className="media-actions"><button className="outline" onClick={refresh} disabled={!desktop || busy}><RefreshCw size={16}/> Làm mới</button></div></div>
    {!desktop && <div className="desktop-notice"><HardDrive size={23}/><div><strong>Hãy mở bằng ứng dụng FlowPost AI Desktop</strong><span>Chỉ bản Tauri mới đọc được lịch.</span></div></div>}
    {err && <div className="error-box">{err}</div>}
    <div style={{display:'flex', gap:8, marginBottom:14}}>
      <button className={tab==='Calendar'?'primary':'outline'} onClick={()=>setTab('Calendar')} style={{height:32}}><CalendarDays size={14}/> Lịch tháng</button>
      <button className={tab==='Queue'?'primary':'outline'} onClick={()=>setTab('Queue')} style={{height:32}}><Clock3 size={14}/> Hàng đợi ({schedules.length})</button>
    </div>
    {tab==='Calendar' ? <>
      <div className="panel" style={{padding:14, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <button className="outline" onClick={()=>setMonth(new Date(month.getFullYear(), month.getMonth()-1, 1))} style={{height:32}}>‹ Tháng trước</button>
        <strong style={{fontSize:15}}>Tháng {month.getMonth()+1}/{month.getFullYear()}</strong>
        <button className="outline" onClick={()=>setMonth(new Date(month.getFullYear(), month.getMonth()+1, 1))} style={{height:32}}>Tháng sau ›</button>
      </div>
      <div className="panel" style={{padding:12, marginTop:12}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8, fontSize:11, fontWeight:700, color:'#777', marginBottom:8}}>
          <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8}}>
          {cells.map((d, idx) => {
            const list = schedulesForDay(d)
            const today = isToday(d)
            return <div key={idx} className="day-cell" style={{minHeight:92, border: today ? '2px solid #6558d6' : '1px solid #e9e9ee', borderRadius:10, padding:8, background: d ? (today ? '#f7f6fe' : '#fff') : '#f9f9f9'}}>
              {d && <><div style={{fontSize:12, fontWeight: today ? 800 : 600, color: today ? '#6558d6' : '#333'}}>{d.getDate()}</div>
              <div style={{marginTop:6, display:'flex', flexDirection:'column', gap:4}}>
                {list.slice(0,3).map(s => {
                  const c = contentMap.get(s.contentId)
                  return <span key={s.id} style={{fontSize:9, background: s.platform==='Sống Tích Cực' ? '#efedff' : s.platform==='Daily Motivation' ? '#fff3e0' : '#e8f5e9', color:'#333', padding:'2px 6px', borderRadius:6, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{formatTime(s.scheduledAt)} {c ? c.title.slice(0,18) : s.contentId.slice(0,6)}</span>
                })}
                {list.length>3 && <span style={{fontSize:9, color:'#777'}}>+{list.length-3} nữa</span>}
                {list.length===0 && <span style={{fontSize:9, color:'#bbb'}}>—</span>}
              </div></>}
            </div>
          })}
        </div>
      </div>
    </> : <div className="panel" style={{padding:0, overflow:'hidden'}}>
      <div style={{padding:'12px 14px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}>
        <strong style={{fontSize:13}}>Hàng đợi ({schedules.length})</strong><span style={{fontSize:11, color:'#777'}}>Sắp xếp theo thời gian</span>
      </div>
      {schedules.length ? <div className="table-wrap"><table><thead><tr><th>THỜI GIAN</th><th>NỘI DUNG</th><th>TRANG</th><th>TRẠNG THÁI</th><th></th></tr></thead><tbody>{schedules.map(s => {
        const c = contentMap.get(s.contentId)
        return <tr key={s.id}><td>{formatFull(s.scheduledAt)}</td><td><strong style={{fontSize:12}}>{c ? c.title : s.contentId}</strong><div style={{fontSize:10, color:'#777'}}>{c ? c.prompt.slice(0,40) : ''}</div></td><td><span style={{fontSize:11, background:'#f0eefc', padding:'3px 7px', borderRadius:10}}>{s.platform}</span></td><td><span style={{fontSize:10, padding:'3px 7px', borderRadius:10, background: s.status==='Scheduled' ? '#fff3cd' : s.status==='Published' ? '#e8f5e9' : '#fdecea', color: s.status==='Scheduled' ? '#664d03' : s.status==='Published' ? '#2e7d32' : '#611a15'}}>{s.status}</span></td><td><button className="outline" onClick={()=>deleteItem(s.id)} style={{height:28, fontSize:11}}><Trash2 size={12}/> Xóa</button></td></tr>
      })}</tbody></table></div> : <div className="media-empty" style={{padding:30}}><div><CalendarDays size={34}/></div><h2>Chưa có lịch nào</h2><p>Hãy duyệt nội dung ở Kho và bấm Lên lịch.</p></div>}
    </div>}
  </section>
}

function DashboardSchedulePanel({ onViewAll }) {
  const desktop = isDesktop()
  const [todaySchedules, setTodaySchedules] = useState([])
  const [contentMap, setContentMap] = useState(new Map())
  useEffect(() => {
    if (!desktop) return
    const load = async () => {
      try {
        const [s, c] = await Promise.all([invokeDesktop('list_schedule'), invokeDesktop('list_content')])
        const todayStr = new Date().toDateString()
        const todayList = s.filter(x => new Date(x.scheduledAt).toDateString() === todayStr && x.status === 'Scheduled').sort((a,b)=> new Date(a.scheduledAt) - new Date(b.scheduledAt)).slice(0,3)
        setTodaySchedules(todayList)
        setContentMap(new Map(c.map(x=>[x.id, x])))
      } catch { /* ignore */ }
    }
    load()
    const id = setInterval(load, 4000)
    return () => clearInterval(id)
  }, [desktop])
  const formatTime = (iso) => new Intl.DateTimeFormat('vi-VN', { hour:'2-digit', minute:'2-digit'}).format(new Date(iso))
  const dotColor = (platform) => platform==='Sống Tích Cực' ? 'purple-dot' : platform==='Daily Motivation' ? 'orange-dot' : 'green-dot'
  return <div className="panel schedule-panel">
    <div className="panel-head"><div><h2>Lịch sắp tới</h2><p>{todaySchedules.length} tác vụ trong hôm nay</p></div><button onClick={onViewAll}><MoreHorizontal size={20}/></button></div>
    <div className="timeline">
      {todaySchedules.length ? todaySchedules.map(s => {
        const c = contentMap.get(s.contentId)
        return <div className="task" key={s.id}><time>{formatTime(s.scheduledAt)}</time><i className={`dot ${dotColor(s.platform)}`}/><div><strong>{c ? c.title.slice(0,28) : s.contentId.slice(0,8)}</strong><span>{s.platform} • {c ? c.style : s.contentId}</span><small><Send size={12}/> Đã lên lịch</small></div></div>
      }) : <>
        <div className="task"><time>10:00</time><i className="dot purple-dot"/><div><strong>Chưa có lịch hôm nay</strong><span>Hãy tạo lịch từ Kho nội dung</span><small><CalendarDays size={12}/> Trống</small></div></div>
      </>}
    </div>
    <button className="schedule-link" onClick={onViewAll}>Xem tất cả lịch <span>→</span></button>
  </div>
}

function App() {
  const [active, setActive] = useState('Tổng quan')
  const [period, setPeriod] = useState('7 ngày qua')
  const [toast, setToast] = useState(false)
  const [contentCount, setContentCount] = useState(0)
  const desktop = isDesktop()
  const today = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date())
  const createPost = () => { setActive('AI Content'); setToast(true); setTimeout(() => setToast(false), 2600) }

  useEffect(() => {
    if (!desktop) return
    const load = async () => {
      try { const list = await invokeDesktop('list_content'); setContentCount(list.length) } catch { /* ignore - keep badge */ }
    }
    load()
    const id = setInterval(load, 4000)
    return () => clearInterval(id)
  }, [desktop, active])

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><WandSparkles size={21}/></div><span>FlowPost <b>AI</b></span></div>
      <nav>{nav.map(([name, Icon]) => <button className={active === name ? 'active' : ''} onClick={() => setActive(name)} key={name}><Icon size={19}/><span>{name}</span>{name === 'Kho nội dung' && <em>{contentCount}</em>}</button>)}</nav>
      <div className="sidebar-bottom">
        <button onClick={() => setActive('Cài đặt')} className={active === 'Cài đặt' ? 'active' : ''}><Settings size={19}/><span>Cài đặt</span></button>
        <SettingsStatus/>
        <div className="profile"><div className="avatar">NA</div><div><strong>Nguyễn An</strong><span>Quản trị viên</span></div><ChevronDown size={17}/></div>
      </div>
    </aside>

    <main>
      <header><div className="search"><Search size={18}/><input aria-label="Tìm kiếm" placeholder="Tìm kiếm nội dung, bài viết..."/><kbd>⌘ K</kbd></div><div className="head-actions"><button className="bell" aria-label="Thông báo"><Bell size={20}/><i/></button><button className="primary" onClick={createPost}><Plus size={19}/> Tạo nội dung mới</button></div></header>
      <div className="content">
        {active === 'AI Content' ? <AiContentPage/> : active === 'Kho nội dung' ? <ContentWarehousePage/> : active === 'Thư viện media' ? <MediaLibrary/> : active === 'Lịch nội dung' ? <SchedulePage/> : active === 'Cài đặt' ? <SettingsPage/> : <>
        <section className="welcome"><div><p>{today}</p><h1>Chào buổi sáng, An! <span>👋</span></h1><div className="welcome-sub">Hôm nay bạn có <b>3 bài viết</b> đang chờ được đăng.</div></div><button className="outline" onClick={()=>setActive('Lịch nội dung')}><CalendarDays size={17}/> Xem lịch nội dung</button></section>

        <section className="stats-grid">
          <StatCard icon={FileText} iconClass="purple" label="Bài viết tháng này" value="86" delta="12.5%" sub="so với tháng trước"/>
          <StatCard icon={Send} iconClass="green" label="Đã đăng thành công" value="72" delta="8.2%" sub="14 bài đang chờ"/>
          <StatCard icon={Heart} iconClass="orange" label="Tổng tương tác" value="24.8K" delta="18.4%" sub="trong 30 ngày qua"/>
          <StatCard icon={TrendingUp} iconClass="blue" label="Tỷ lệ tương tác" value="6.8%" delta="2.1%" sub="trung bình các trang"/>
        </section>

        <section className="middle-grid">
          <div className="panel chart-panel">
            <div className="panel-head"><div><h2>Hiệu suất nội dung</h2><p>Lượt tương tác trong 7 ngày gần nhất</p></div><select value={period} onChange={e => setPeriod(e.target.value)}><option>7 ngày qua</option><option>30 ngày qua</option></select></div>
            <div className="chart-total"><strong>5.660</strong><span><TrendingUp size={13}/> 15.2%</span></div>
            <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top: 8, right: 8, left: -20, bottom: 0}}><defs><linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6558d6" stopOpacity={0.25}/><stop offset="95%" stopColor="#6558d6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ececf2"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#8c8b98', fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#aaa9b3', fontSize:11}}/><Tooltip contentStyle={{border:'none', borderRadius:10, boxShadow:'0 8px 30px #2222'}}/><Area type="monotone" dataKey="engagement" stroke="#6558d6" strokeWidth={2.5} fill="url(#colorEng)"/></AreaChart></ResponsiveContainer></div>
          </div>
          <DashboardSchedulePanel onViewAll={()=>setActive('Lịch nội dung')} />
        </section>

        <section className="panel recent">
          <div className="panel-head"><div><h2>Bài viết gần đây</h2><p>Theo dõi trạng thái và hiệu quả bài đăng</p></div><button className="text-link">Xem tất cả <span>→</span></button></div>
          <div className="table-wrap"><table><thead><tr><th>NỘI DUNG</th><th>TRANG</th><th>THỜI GIAN</th><th>LOẠI</th><th>TRẠNG THÁI</th><th>TIẾP CẬN</th><th>TƯƠNG TÁC</th><th></th></tr></thead><tbody>{posts.map((p, i) => <tr key={p.title}><td><div className="post-title"><div className={`thumb thumb${i+1}`}>{i === 0 ? '☀️' : i === 1 ? '“' : '▶'}</div><strong>{p.title}</strong></div></td><td><div className="page"><i style={{background:p.color}}>{p.initials}</i>{p.page}</div></td><td>{p.date}</td><td><span className="type">{p.type}</span></td><td><span className={p.pending ? 'status pending' : 'status success'}>{p.pending ? <Clock3 size={13}/> : <CircleCheck size={13}/>} {p.pending ? 'Đang xử lý' : p.status}</span></td><td><strong>{p.reach}</strong></td><td><div className="engage"><span><Heart size={14}/> {p.likes || '—'}</span><span><MessageCircle size={14}/> {p.comments || '—'}</span></div></td><td><button className="row-more" aria-label="Thao tác"><MoreHorizontal size={18}/></button></td></tr>)}</tbody></table></div>
        </section>
        </>}
        <footer><span>© 2026 FlowPost AI</span><span>Trạng thái hệ thống <i/> Hoạt động ổn định</span></footer>
      </div>
    </main>
    {toast && <div className="toast"><CircleCheck size={19}/><div><strong>Đã mở trình tạo nội dung</strong><span>Sẵn sàng sáng tạo bài viết mới cùng AI.</span></div></div>}
  </div>
}

export default App
