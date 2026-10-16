import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDownToLine, ArrowLeftRight, Bell, BellOff, Check, ChevronRight, CircleHelp, CreditCard, Eye, EyeOff, FileText, Home, Menu, Moon, MoreHorizontal, Plus, QrCode, Search, Settings, ShieldCheck, Sun, TrendingUp, User, Wallet, X } from 'lucide-react';
import './styles.css';

const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const makeAccountNumber = () => String(Math.floor(1000000000 + Math.random() * 8999999999));
const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

const nav = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'payments', label: 'Payments', icon: Wallet },
  { id: 'investments', label: 'Investments', icon: TrendingUp },
  { id: 'support', label: 'Support', icon: CircleHelp },
  { id: 'profile', label: 'Profile', icon: User },
];

const actions = [
  ['transfer', 'Transfer', ArrowLeftRight], ['withdraw', 'Withdraw', ArrowDownToLine], ['add', 'Add money', Plus],
  ['pay', 'Pay bills', FileText], ['cards', 'Cards', CreditCard], ['scan', 'Scan to pay', QrCode],
];

const defaultMember = { id: 'member-1', name: 'AetherBank Member', accountNumber: makeAccountNumber(), checking: 0, savings: 0 };

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('aetherbank-state'));
    if (saved?.member) return saved;
  } catch {}
  return { member: defaultMember, members: [defaultMember], transactions: [], theme: localStorage.getItem('aether-theme') || 'light', notifications: true };
}

function App() {
  const initial = loadState();
  const [theme, setTheme] = useState(initial.theme);
  const [member, setMember] = useState(initial.member);
  const [members, setMembers] = useState(initial.members || [initial.member]);
  const [transactions, setTransactions] = useState(initial.transactions || []);
  const [notifications, setNotifications] = useState(initial.notifications !== false);
  const [active, setActive] = useState('home');
  const [modal, setModal] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [toast, setToast] = useState('');

  const total = member.checking + member.savings;
  const spend = useMemo(() => transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + Math.abs(t.amount), 0), [transactions]);

  const persist = (nextMember = member, nextMembers = members, nextTransactions = transactions, nextTheme = theme, nextNotifications = notifications) => {
    localStorage.setItem('aetherbank-state', JSON.stringify({ member: nextMember, members: nextMembers, transactions: nextTransactions, theme: nextTheme, notifications: nextNotifications }));
  };
  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  const setAndSaveTheme = (value) => { setTheme(value); localStorage.setItem('aether-theme', value); persist(member, members, transactions, value, notifications); };
  const setAndSaveNotifications = (value) => { setNotifications(value); persist(member, members, transactions, theme, value); };

  const addMoney = (amount) => {
    if (!Number.isFinite(amount) || amount <= 0) return notify('Enter a valid amount.');
    const next = { ...member, checking: member.checking + amount };
    const tx = { id: makeId(), type: 'credit', merchant: 'Account funding', note: 'Added to checking', amount, date: 'Just now' };
    const nextTx = [tx, ...transactions]; setMember(next); setTransactions(nextTx); persist(next, members, nextTx); setModal(null); notify(`${money(amount)} added to your account.`);
  };

  const transfer = (amount, accountNumber) => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return notify('Enter a valid transfer amount.');
    const recipient = members.find(m => m.accountNumber === accountNumber && m.id !== member.id);
    if (!recipient) return notify('That account number is not registered with AetherBank.');
    if (value > member.checking) return notify('Transfer declined — available balance is $0.00.');
    const nextMember = { ...member, checking: member.checking - value };
    const nextRecipient = { ...recipient, checking: recipient.checking + value };
    const nextMembers = members.map(m => m.id === member.id ? nextMember : m.id === recipient.id ? nextRecipient : m);
    const tx = { id: makeId(), type: 'debit', merchant: recipient.name, note: `Transfer to ${recipient.accountNumber}`, amount: -value, date: 'Just now' };
    const nextTx = [tx, ...transactions]; setMember(nextMember); setMembers(nextMembers); setTransactions(nextTx); persist(nextMember, nextMembers, nextTx); setModal(null); notify('Transfer completed successfully.');
  };

  const spendMoney = (amount, merchant) => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return notify('Enter a valid amount.');
    if (value > member.checking) return notify('Payment declined — available balance is $0.00.');
    const next = { ...member, checking: member.checking - value };
    const tx = { id: makeId(), type: 'debit', merchant, note: 'Account payment', amount: -value, date: 'Just now' };
    const nextTx = [tx, ...transactions]; setMember(next); setTransactions(nextTx); persist(next, members, nextTx); setModal(null); notify('Payment completed successfully.');
  };

  const registerMember = (name) => {
    const clean = name.trim(); if (!clean) return notify('Enter a member name.');
    const newMember = { id: makeId(), name: clean, accountNumber: makeAccountNumber(), checking: 0, savings: 0 };
    const nextMembers = [...members, newMember];
    setMembers(nextMembers); persist(member, nextMembers, transactions); setModal(null); notify(`Member registered. Account number: ${newMember.accountNumber}`);
  };

  return <div className={`app ${theme}`}>
    <div className="phone-shell">
      <header className="topbar">
        <button className="icon-button" onClick={() => setMenuOpen(true)} aria-label="Menu"><Menu size={24} /></button>
        <button className="brand" onClick={() => setActive('home')}><span className="brand-mark">AE</span><span>AetherBank</span></button>
        <button className="icon-button notification-button" onClick={() => setAndSaveNotifications(!notifications)}>{notifications ? <Bell size={23} /> : <BellOff size={23} />}{notifications && <i />}</button>
      </header>
      <main className="content">
        {active === 'home' && <Home member={member} total={total} hidden={hidden} setHidden={setHidden} spend={spend} transactions={transactions} open={setModal} />}
        {active === 'payments' && <Payments transactions={transactions} open={setModal} />}
        {active === 'investments' && <Investments open={setModal} />}
        {active === 'support' && <Support notify={notify} />}
        {active === 'profile' && <Profile member={member} theme={theme} setTheme={setAndSaveTheme} notifications={notifications} setNotifications={setAndSaveNotifications} open={setModal} />}
      </main>
      <nav className="bottom-nav">{nav.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? 'active' : ''} onClick={() => setActive(id)}><Icon size={22} /><span>{label}</span></button>)}</nav>
      {menuOpen && <Drawer close={() => setMenuOpen(false)} setActive={setActive} settings={() => { setMenuOpen(false); setModal('settings'); }} />}
      {modal && <Modal type={modal} close={() => setModal(null)} member={member} members={members} addMoney={addMoney} transfer={transfer} spend={spendMoney} register={registerMember} theme={theme} setTheme={setAndSaveTheme} notifications={notifications} setNotifications={setAndSaveNotifications} />}
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  </div>;
}

function Home({ member, total, hidden, setHidden, spend, transactions, open }) {
  const show = n => hidden ? '••••••' : money(n);
  return <>
    <section className="hero-card">
      <div className="balance-row"><div><p>Personal Checking</p><small>Available: {show(member.checking)}</small></div><strong>{show(member.checking)}</strong></div>
      <div className="divider" />
      <div className="balance-row savings"><div><p>Savings</p><small>Available to save</small></div><strong>{show(member.savings)}</strong></div>
      <div className="card-row"><div className="bank-card"><div className="mini-brand"><span>AE</span>AetherBank</div><div className="chip" /><div className="contactless">⌁</div><div className="card-name">{member.name}</div><div className="last-four">Account: •••• {member.accountNumber.slice(-4)}</div><div className="card-dots"><i /><i /></div></div><div className="spend"><span>Card spend</span><b>{money(spend)}</b><div className="progress"><i style={{ width: `${Math.min(100, spend / 30)}%` }} /></div><small>Available: {money(member.checking)}</small></div></div>
      <div className="demo-note"><ShieldCheck size={14} /> AetherBank member account · {member.accountNumber}</div>
    </section>
    <div className="balance-strip"><span>Total balance</span><strong>{hidden ? '••••••' : money(total)}</strong><button onClick={() => setHidden(!hidden)}>{hidden ? <Eye size={17} /> : <EyeOff size={17} />}</button></div>
    <section className="actions-section"><h2>Banking actions</h2><div className="action-grid">{actions.map(([id, label, Icon]) => <button key={id} onClick={() => open(id)}><span><Icon size={23} /></span><b>{label}</b></button>)}<button onClick={() => open('register')}><span><User size={23} /></span><b>Register member</b></button></div></section>
    <section className="transactions"><div className="section-heading"><h2>Recent transactions</h2><button onClick={() => open('transactions')}><MoreHorizontal size={20} /></button></div><div className="search"><Search size={18} /><span>Search transactions</span></div>{transactions.length ? transactions.slice(0, 8).map(t => <Transaction key={t.id} item={t} />) : <Empty />}</section>
  </>;
}

function Transaction({ item }) { const positive = item.amount > 0; return <div className="transaction"><div className={`merchant-icon ${positive ? 'positive' : ''}`}>{positive ? <Plus size={17} /> : <CreditCard size={17} />}</div><div className="transaction-copy"><b>{item.merchant}</b><span>{item.note} · {item.date}</span></div><strong className={positive ? 'positive-text' : ''}>{positive ? '+' : '−'}{money(Math.abs(item.amount))}</strong></div>; }
function Empty() { return <div className="empty"><div className="empty-icon"><Wallet size={22} /></div><div><b>No transactions yet</b><p>Your account activity will appear here.</p></div></div>; }
function Page({ title, subtitle, children }) { return <section className="page"><div className="page-head"><h1>{title}</h1><p>{subtitle}</p></div>{children}</section>; }
function Feature({ icon: Icon, title, text, onClick }) { return <button className="feature" onClick={onClick}><span><Icon size={22} /></span><div><b>{title}</b><p>{text}</p></div><ChevronRight size={18} /></button>; }

function Payments({ transactions, open }) { return <Page title="Payments" subtitle="Move money and manage your everyday banking."><div className="feature-grid"><Feature icon={ArrowLeftRight} title="Transfer" text="Send money to another AetherBank member." onClick={() => open('transfer')} /><Feature icon={FileText} title="Pay a bill" text="Make a payment from your checking account." onClick={() => open('pay')} /><Feature icon={QrCode} title="Scan to pay" text="Open the secure payment scanner." onClick={() => open('scan')} /><Feature icon={CreditCard} title="Cards" text="Manage your AetherBank card." onClick={() => open('cards')} /></div><div className="panel"><div className="section-heading"><h2>Payment activity</h2><span>{transactions.length} transactions</span></div>{transactions.length ? transactions.slice(0, 8).map(t => <Transaction key={t.id} item={t} />) : <Empty />}</div></Page>; }
function Investments({ open }) { return <Page title="Investments" subtitle="Manage your future wealth in one place."><div className="investment-card"><div className="eyebrow">PORTFOLIO VALUE</div><strong>$0.00</strong><div className="investment-line"><TrendingUp size={18} /><span>0.00% today</span></div><p>Your investment balance is currently $0.00.</p></div><div className="panel"><div className="section-heading"><h2>Watchlist</h2><button onClick={() => open('invest')}>Manage</button></div><div className="watch-row"><span>Aether Index</span><b>$0.00</b><small>0.00%</small></div><div className="watch-row"><span>Aether Bond</span><b>$0.00</b><small>0.00%</small></div></div></Page>; }
function Support({ notify }) { return <Page title="Support" subtitle="Get help with your AetherBank account."><div className="support-hero"><div className="support-orb"><CircleHelp size={30} /></div><div><b>How can we help?</b><p>Find answers or contact AetherBank support.</p></div></div>{['How do I add money?', 'Why is my balance $0?', 'How do internal transfers work?', 'How do I change my theme?'].map(q => <button className="list-item" key={q} onClick={() => notify('Help information opened.')}>{q}<ChevronRight size={18} /></button>)}<button className="primary-button" onClick={() => notify('Support request started.')}>Contact support</button></Page>; }
function Profile({ member, theme, setTheme, notifications, setNotifications, open }) { return <Page title="Profile" subtitle="Your AetherBank identity and preferences."><div className="profile-card"><div className="avatar">AE</div><div><b>{member.name}</b><p>Account {member.accountNumber}</p></div><ShieldCheck size={20} /></div><div className="panel"><button className="settings-row" onClick={() => open('settings')}><span><Settings size={19} /> Settings</span><ChevronRight size={18} /></button><button className="settings-row" onClick={() => setNotifications(!notifications)}><span>{notifications ? <Bell size={19} /> : <BellOff size={19} />} Notifications</span><em>{notifications ? 'On' : 'Off'}</em></button><div className="theme-choice"><span>Theme</span><div><button className={theme === 'light' ? 'selected' : ''} onClick={() => setTheme('light')}><Sun size={16} /> Light</button><button className={theme === 'dark' ? 'selected' : ''} onClick={() => setTheme('dark')}><Moon size={16} /> Dark</button></div></div></div><div className="security-box"><ShieldCheck size={20} /><div><b>Account security</b><p>Security, identity verification and banking credentials will be connected as the banking infrastructure is registered.</p></div></div></Page>; }

function Drawer({ close, setActive, settings }) { return <div className="drawer-backdrop" onClick={close}><aside className="drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><div className="brand"><span className="brand-mark">AE</span><span>AetherBank</span></div><button className="icon-button" onClick={close}><X size={22} /></button></div><p className="drawer-label">Navigation</p>{nav.map(({ id, label, icon: Icon }) => <button className="drawer-link" key={id} onClick={() => { setActive(id); close(); }}><Icon size={19} />{label}<ChevronRight size={16} /></button>)}<p className="drawer-label">Account</p><button className="drawer-link" onClick={settings}><Settings size={19} />Settings<ChevronRight size={16} /></button><div className="drawer-demo"><ShieldCheck size={17} /><span>Protected banking account<br /><small>Identity and payment controls</small></span></div></aside></div>; }

function Modal({ type, close, member, members, addMoney, transfer, spend, register, theme, setTheme, notifications, setNotifications }) {
  const [amount, setAmount] = useState(''); const [recipient, setRecipient] = useState(''); const [payee, setPayee] = useState('Utility bill'); const [name, setName] = useState('');
  const titles = { add: 'Add money', transfer: 'Transfer', withdraw: 'Withdraw', pay: 'Pay a bill', cards: 'Cards', scan: 'Scan to pay', transactions: 'Transactions', settings: 'Settings', register: 'Register member', invest: 'Watchlist' };
  const submit = () => { if (type === 'add') addMoney(Number(amount)); else if (type === 'transfer') transfer(Number(amount), recipient.trim()); else if (type === 'withdraw') spend(Number(amount), 'ATM withdrawal'); else if (type === 'pay') spend(Number(amount), payee || 'Bill payment'); else if (type === 'scan') spend(Number(amount), 'QR payment'); else if (type === 'register') register(name); };
  return <div className="modal-backdrop" onClick={close}><section className="modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">AETHERBANK</span><h2>{titles[type]}</h2></div><button className="icon-button" onClick={close}><X size={21} /></button></div>
    {type === 'settings' && <><div className="setting-block"><b>Appearance</b><p>Choose the AetherBank interface theme.</p><div className="theme-toggle"><button className={theme === 'light' ? 'selected' : ''} onClick={() => setTheme('light')}><Sun size={17} /> Light</button><button className={theme === 'dark' ? 'selected' : ''} onClick={() => setTheme('dark')}><Moon size={17} /> Dark</button></div></div><div className="setting-line" onClick={() => setNotifications(!notifications)}><span><Bell size={18} /><div><b>Notifications</b><small>Account alerts and activity updates</small></div></span><span className={`switch ${notifications ? 'on' : ''}`}><i /></span></div><div className="setting-line"><span><ShieldCheck size={18} /><div><b>Security</b><small>Identity and account protection</small></div></span><Check size={18} /></div><button className="primary-button" onClick={close}>Done</button></>}
    {type === 'register' && <><label className="field-label">Member name</label><input className="text-input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Full name" /><p className="modal-copy">A unique AetherBank account number will be issued when the member is registered.</p><button className="primary-button" onClick={submit}>Register member</button></>}
    {type === 'transfer' && <><label className="field-label">Recipient account number</label><input className="text-input" inputMode="numeric" value={recipient} onChange={e => setRecipient(e.target.value.replace(/\D/g, ''))} placeholder="10-digit account number" /><div className="member-hint">{members.filter(m => m.id !== member.id).slice(0, 4).map(m => <button key={m.id} onClick={() => setRecipient(m.accountNumber)}>{m.name}<span>{m.accountNumber}</span></button>)}</div><label className="field-label">Amount</label><div className="amount-field"><span>$</span><input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" /></div><div className="transfer-balance"><span>Available</span><b>{money(member.checking)}</b></div><button className="primary-button" onClick={submit}>Transfer money</button></>}
    {(type === 'add' || type === 'withdraw' || type === 'pay' || type === 'scan') && <><label className="field-label">Amount</label><div className="amount-field"><span>$</span><input autoFocus inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" /></div>{type === 'pay' && <><label className="field-label">Payee</label><input className="text-input" value={payee} onChange={e => setPayee(e.target.value)} /></>}{type === 'scan' && <div className="qr-placeholder"><QrCode size={82} /><span>Payment scanner</span></div>}<button className="primary-button" onClick={submit}>{type === 'add' ? 'Add money' : type === 'withdraw' ? 'Withdraw' : 'Continue'}</button></>}
    {type === 'cards' && <><div className="modal-card"><div className="mini-brand"><span>AE</span>AetherBank</div><div className="chip" /><div className="contactless">⌁</div><b>{member.name}</b><small>Account •••• {member.accountNumber.slice(-4)}</small></div><div className="info-row"><span>Card status</span><b className="positive-text">Active</b></div><div className="info-row"><span>Available to spend</span><b>{money(member.checking)}</b></div><button className="primary-button" onClick={close}>Done</button></>}
    {type === 'transactions' && <><Empty /><button className="primary-button" onClick={close}>Close</button></>}
    {type === 'invest' && <><div className="watch-row"><span>Aether Index</span><b>$0.00</b><small>0.00%</small></div><div className="watch-row"><span>Aether Bond</span><b>$0.00</b><small>0.00%</small></div><button className="primary-button" onClick={close}>Done</button></>}
  </section></div>;
}

createRoot(document.getElementById('root')).render(<App />);
