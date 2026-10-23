
import { useEffect, useState } from 'react'
import { getIdTokenResult, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { Activity, Boxes, ClipboardList, LogOut, RefreshCw, ShieldCheck, Users } from 'lucide-react'
import { auth, db } from './firebase'
import './App.css'

type Row = Record<string, any> & { id: string }
type Tab = 'Overview' | 'Orders' | 'Products' | 'Dealers' | 'Services' | 'Customers'
const tabs: { name: Tab; icon: typeof Activity; collection: string }[] = [
  { name: 'Overview', icon: Activity, collection: '' }, { name: 'Orders', icon: ClipboardList, collection: 'orders' },
  { name: 'Products', icon: Boxes, collection: 'products' }, { name: 'Dealers', icon: ShieldCheck, collection: 'dealerApplications' },
  { name: 'Services', icon: RefreshCw, collection: 'serviceBookings' }, { name: 'Customers', icon: Users, collection: 'users' },
]

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authorized, setAuthorized] = useState(false)
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const [tab, setTab] = useState<Tab>('Overview'); const [rows, setRows] = useState<Row[]>([])
  const [allOrders, setAllOrders] = useState<Row[]>([]); const [allUsers, setAllUsers] = useState<Row[]>([])
  const [queryText, setQueryText] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  useEffect(() => onAuthStateChanged(auth, async current => {
    setUser(current)
    if (!current) { setAuthorized(false); return }
    try { const claims = await getIdTokenResult(current, true); setAuthorized(claims.claims.admin === true || claims.claims.role === 'admin') }
    catch { setAuthorized(false) }
  }), [])
  async function load() {
    if (!authorized || !user) return
    setBusy(true); setError('')
    try {
      const [orders, users] = await Promise.all([getDocs(query(collection(db, 'orders'), orderBy('placedAt', 'desc'))), getDocs(collection(db, 'users'))])
      setAllOrders(orders.docs.map(d => ({ id: d.id, ...d.data() }))); setAllUsers(users.docs.map(d => ({ id: d.id, ...d.data() })))
      const c = tabs.find(t => t.name === tab)?.collection
      if (c) {
        const snap = await getDocs(collection(db, c))
        let nextRows: Row[] = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        if (tab === 'Products') {
          const prices = await getDocs(collection(db, 'dealerPrices'))
          const byProduct = new Map(prices.docs.map(d => [d.id, Number(d.data().price)]))
          nextRows = nextRows.map(row => ({ ...row, dealerPrice: byProduct.get(row.id) ?? Number(row.retailPrice ?? 0) }))
        }
        setRows(nextRows)
      }
      else setRows([])
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load data. Check your Firebase configuration and permissions.') }
    finally { setBusy(false) }
  }
  useEffect(() => { void load() }, [authorized, user, tab])
  async function login(e: React.FormEvent) {
    e.preventDefault(); setError('')
    try { const credential = await signInWithEmailAndPassword(auth, email, password); const claims = await getIdTokenResult(credential.user, true); if (claims.claims.admin !== true && claims.claims.role !== 'admin') { await signOut(auth); throw new Error('This account is not authorized as an administrator.') } setAuthorized(true) }
    catch (e) { setError(e instanceof Error ? e.message : 'Sign in failed') }
  }
  async function updateStatus(row: Row, status: string) {
    const col = tab === 'Dealers' ? 'dealerApplications' : tab === 'Services' ? 'serviceBookings' : 'orders'
    try { await updateDoc(doc(db, col, row.id), { status, updatedAt: serverTimestamp() }); if (tab === 'Dealers') await updateDoc(doc(db, 'users', row.uid ?? row.id), { dealerStatus: status, ...(status === 'approved' ? { approvedAt: serverTimestamp() } : {}), updatedAt: serverTimestamp() }); await load() }
    catch (e) { setError(e instanceof Error ? e.message : 'Update failed') }
  }
  async function editProduct(row: Row) {
    const retailPrice = Number(window.prompt('Retail price (INR)', String(row.retailPrice ?? '')))
    const dealerPrice = Number(window.prompt('Dealer price (INR)', String(row.dealerPrice ?? '')))
    const stock = Number(window.prompt('Available stock', String(row.stock ?? '')))
    if (![retailPrice, dealerPrice, stock].every(Number.isFinite) || retailPrice <= dealerPrice || dealerPrice <= 0 || stock < 0) { setError('Enter valid prices and a non-negative stock quantity.'); return }
    try {
      const batch = writeBatch(db)
      batch.update(doc(db, 'products', row.id), { retailPrice, stock, updatedAt: serverTimestamp() })
      batch.set(doc(db, 'dealerPrices', row.id), { price: dealerPrice, updatedAt: serverTimestamp() })
      await batch.commit()
      await load()
    }
    catch (e) { setError(e instanceof Error ? e.message : 'Product update failed') }
  }
  async function repairProductTimestamps() {
    setBusy(true); setError('')
    try {
      const snapshot = await getDocs(collection(db, 'products'))
      const missing = snapshot.docs.filter(product => !product.data().createdAt)
      if (missing.length === 0) { setError('All products already have a createdAt timestamp.'); return }
      for (let start = 0; start < missing.length; start += 450) {
        const batch = writeBatch(db)
        missing.slice(start, start + 450).forEach(product => {
          const data = product.data()
          batch.update(product.ref, { createdAt: serverTimestamp(), ...(!data.updatedAt ? { updatedAt: serverTimestamp() } : {}) })
        })
        await batch.commit()
      }
      setError(`Repaired createdAt on ${missing.length} product${missing.length === 1 ? '' : 's'}. Refresh “See All” in the mobile app.`)
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Timestamp repair failed. Check admin permissions.') }
    finally { setBusy(false) }
  }
  async function addProduct() {
    const name = window.prompt('Product name'); if (!name?.trim()) return
    const retailPrice = Number(window.prompt('Retail price (INR)', '9999')); const dealerPrice = Number(window.prompt('Dealer price (INR)', '7500'))
    if (!Number.isFinite(retailPrice) || !Number.isFinite(dealerPrice) || dealerPrice <= 0 || retailPrice <= dealerPrice) { setError('Enter valid prices with dealer price below retail price.'); return }
    try {
      const product = await addDoc(collection(db, 'products'), { name, category: 'water-purifiers', brand: 'Califnco', description: '', retailPrice, stock: 0, rating: 0, reviewCount: 0, images: [], tags: [], specifications: {}, isActive: true, isFeatured: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      await setDoc(doc(db, 'dealerPrices', product.id), { price: dealerPrice, updatedAt: serverTimestamp() })
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Product creation failed') }
  }
  if (!user || !authorized) return <main className="login"><form onSubmit={login}><span className="brand-mark">C</span><p className="eyebrow">CALIFNCO COMMERCE</p><h1>Admin console</h1><p className="muted">Sign in with an account granted the Firebase admin custom claim.</p><label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label><label>Password<input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></label>{error && <p className="error">{error}</p>}<button className="primary">Sign in securely</button></form></main>
  const filtered = rows.filter(r => JSON.stringify(r).toLowerCase().includes(queryText.toLowerCase()))
  return <div className="shell"><aside><div className="brand"><span className="brand-mark">C</span><span>califnco<small>ADMIN CONSOLE</small></span></div><nav>{tabs.map(({ name, icon: Icon }) => <button className={tab === name ? 'selected' : ''} onClick={() => setTab(name)} key={name}><Icon size={18} />{name}</button>)}</nav><div className="aside-foot"><span className="avatar">{user.email?.[0]?.toUpperCase()}</span><span className="truncate">{user.email}</span><button aria-label="Sign out" onClick={() => void signOut(auth)}><LogOut size={16}/></button></div></aside><main className="content"><header><div><p className="eyebrow">MANAGEMENT / {tab.toUpperCase()}</p><h1>{tab === 'Overview' ? 'Good day, admin' : tab}</h1></div><button className="outline" onClick={() => void load()}><RefreshCw size={15}/>{busy ? 'Loading' : 'Refresh'}</button></header>{error && <div className="error-banner">{error}</div>}{tab === 'Overview' ? <><div className="stats"><Stat label="Total orders" value={allOrders.length} icon={<ClipboardList/>}/><Stat label="Gross order value" value={`₹${allOrders.reduce((s,o)=>s+Number(o.totalAmount||0),0).toLocaleString('en-IN')}`} icon={<Activity/>}/><Stat label="Customers & dealers" value={allUsers.length} icon={<Users/>}/><Stat label="Awaiting review" value={allUsers.filter(u=>u.dealerStatus==='pending').length} icon={<ShieldCheck/>}/></div><section className="panel"><h2>Recent orders</h2><DataTable rows={allOrders.slice(0,8)} cols={['orderNumber','userName','totalAmount','status']} onStatus={updateStatus}/></section><div className="notice"><ShieldCheck size={18}/><span><b>Protected admin access</b><br/>Dashboard access requires a Firebase Authentication custom claim. Profile fields alone cannot grant administrator privileges.</span></div></> : <section className="panel"><div className="panel-head"><div><h2>{tab} directory</h2><p>{filtered.length} records</p></div><div className="actions">{tab==='Products'&&<button className="outline" onClick={()=>void repairProductTimestamps()} disabled={busy}>Repair missing timestamps</button>}<input placeholder="Search records…" value={queryText} onChange={e=>setQueryText(e.target.value)}/>{tab==='Products'&&<button className="primary small" onClick={()=>void addProduct()}>Add product</button>}</div></div><DataTable rows={filtered} cols={tab==='Orders'?['orderNumber','userName','totalAmount','status','placedAt']:tab==='Products'?['name','brand','retailPrice','dealerPrice','stock','isActive']:tab==='Dealers'?['businessName','displayName','email','status']:tab==='Services'?['userName','serviceType','preferredDate','status']:['displayName','email','phone','role']} onStatus={updateStatus} statusOptions={tab==='Dealers'?['pending','approved','rejected']:undefined} onProductEdit={tab==='Products'?editProduct:undefined}/></section>}</main></div>
}
function Stat({label,value,icon}:{label:string;value:string|number;icon:React.ReactNode}) { return <div className="stat"><span className="stat-icon">{icon}</span><p>{label}</p><strong>{value}</strong></div> }
function DataTable({rows,cols,onStatus,onProductEdit,statusOptions}:{rows:Row[];cols:string[];onStatus:(r:Row,s:string)=>void;onProductEdit?:(r:Row)=>void;statusOptions?:string[]}) { const defaultStatuses=['pending','confirmed','processing','shipped','delivered','completed','rejected','cancelled']; const allowedStatuses=statusOptions??defaultStatuses; return <div className="table-wrap"><table><thead><tr>{cols.map(c=><th key={c}>{c.replace(/[A-Z]/g,m=>' '+m).toUpperCase()}</th>)}{onProductEdit&&<th>EDIT</th>}</tr></thead><tbody>{rows.map(row=><tr key={row.id}>{cols.map(c=><td key={c}>{c==='status'?<select value={allowedStatuses.includes(row[c])?row[c]:''} onChange={e=>onStatus(row,e.target.value)}>{!allowedStatuses.includes(row[c])&&<option value="" disabled>Select status</option>}{allowedStatuses.map(s=><option key={s}>{s}</option>)}</select>: c==='totalAmount'||c==='retailPrice'||c==='dealerPrice'?`₹${Number(row[c]||0).toLocaleString('en-IN')}`:row[c]?.toDate?row[c].toDate().toLocaleDateString('en-IN'):typeof row[c]==='object'?row[c]?.city??row[c]?.serviceType??'—':String(row[c]??'—')}</td>)}{onProductEdit&&<td><button className="outline" onClick={()=>onProductEdit(row)}>Edit stock/prices</button></td>}</tr>)}</tbody></table>{rows.length===0&&<p className="empty">No records to display yet.</p>}</div> }
