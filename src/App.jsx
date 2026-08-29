import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { LayoutDashboard, Sparkles, Images, CalendarDays, Send, BarChart3, Settings, Search, Bell, ChevronDown, TrendingUp, FileText, Heart, MessageCircle, Plus, Clock3, CircleCheck, MoreHorizontal, WandSparkles, Zap } from 'lucide-react'

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

function App() {
  const [active, setActive] = useState('Tổng quan')
  const [period, setPeriod] = useState('7 ngày qua')
  const [toast, setToast] = useState(false)
  const today = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date())
  const createPost = () => { setToast(true); setTimeout(() => setToast(false), 2600) }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><WandSparkles size={21}/></div><span>FlowPost <b>AI</b></span></div>
      <nav>{nav.map(([name, Icon]) => <button className={active === name ? 'active' : ''} onClick={() => setActive(name)} key={name}><Icon size={19}/><span>{name}</span>{name === 'Kho nội dung' && <em>24</em>}</button>)}</nav>
      <div className="sidebar-bottom">
        <button><Settings size={19}/><span>Cài đặt</span></button>
        <div className="token-box"><div className="token-title"><span><Zap size={14}/> Facebook Token</span><b>28 ngày</b></div><div className="progress"><i/></div><p>Hết hạn vào 28/09/2025</p></div>
        <div className="profile"><div className="avatar">NA</div><div><strong>Nguyễn An</strong><span>Quản trị viên</span></div><ChevronDown size={17}/></div>
      </div>
    </aside>

    <main>
      <header><div className="search"><Search size={18}/><input aria-label="Tìm kiếm" placeholder="Tìm kiếm nội dung, bài viết..."/><kbd>⌘ K</kbd></div><div className="head-actions"><button className="bell" aria-label="Thông báo"><Bell size={20}/><i/></button><button className="primary" onClick={createPost}><Plus size={19}/> Tạo nội dung mới</button></div></header>
      <div className="content">
        <section className="welcome"><div><p>{today}</p><h1>Chào buổi sáng, An! <span>👋</span></h1><div className="welcome-sub">Hôm nay bạn có <b>3 bài viết</b> đang chờ được đăng.</div></div><button className="outline"><CalendarDays size={17}/> Xem lịch nội dung</button></section>

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
          <div className="panel schedule-panel">
            <div className="panel-head"><div><h2>Lịch sắp tới</h2><p>3 tác vụ trong hôm nay</p></div><button><MoreHorizontal size={20}/></button></div>
            <div className="timeline">
              <div className="task"><time>10:00</time><i className="dot purple-dot"/><div><strong>AI viết nội dung</strong><span>Sống Tích Cực • Chủ đề: Lifestyle</span><small><Sparkles size={12}/> Tự động</small></div></div>
              <div className="task"><time>14:30</time><i className="dot orange-dot"/><div><strong>Tạo hình ảnh</strong><span>Daily Motivation • 1 ảnh</span><small><Images size={12}/> AI Image</small></div></div>
              <div className="task"><time>19:00</time><i className="dot green-dot"/><div><strong>Đăng bài Facebook</strong><span>3 trang • Văn bản + ảnh</span><small><Send size={12}/> Đã lên lịch</small></div></div>
            </div>
            <button className="schedule-link">Xem tất cả lịch <span>→</span></button>
          </div>
        </section>

        <section className="panel recent">
          <div className="panel-head"><div><h2>Bài viết gần đây</h2><p>Theo dõi trạng thái và hiệu quả bài đăng</p></div><button className="text-link">Xem tất cả <span>→</span></button></div>
          <div className="table-wrap"><table><thead><tr><th>NỘI DUNG</th><th>TRANG</th><th>THỜI GIAN</th><th>LOẠI</th><th>TRẠNG THÁI</th><th>TIẾP CẬN</th><th>TƯƠNG TÁC</th><th></th></tr></thead><tbody>{posts.map((p, i) => <tr key={p.title}><td><div className="post-title"><div className={`thumb thumb${i+1}`}>{i === 0 ? '☀️' : i === 1 ? '“' : '▶'}</div><strong>{p.title}</strong></div></td><td><div className="page"><i style={{background:p.color}}>{p.initials}</i>{p.page}</div></td><td>{p.date}</td><td><span className="type">{p.type}</span></td><td><span className={p.pending ? 'status pending' : 'status success'}>{p.pending ? <Clock3 size={13}/> : <CircleCheck size={13}/>} {p.pending ? 'Đang xử lý' : p.status}</span></td><td><strong>{p.reach}</strong></td><td><div className="engage"><span><Heart size={14}/> {p.likes || '—'}</span><span><MessageCircle size={14}/> {p.comments || '—'}</span></div></td><td><button className="row-more" aria-label="Thao tác"><MoreHorizontal size={18}/></button></td></tr>)}</tbody></table></div>
        </section>
        <footer><span>© 2025 FlowPost AI</span><span>Trạng thái hệ thống <i/> Hoạt động ổn định</span></footer>
      </div>
    </main>
    {toast && <div className="toast"><CircleCheck size={19}/><div><strong>Đã mở trình tạo nội dung</strong><span>Sẵn sàng sáng tạo bài viết mới cùng AI.</span></div></div>}
  </div>
}

export default App
