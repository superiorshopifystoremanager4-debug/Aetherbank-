import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDownToLine, ArrowLeftRight, Bell, BellOff, Check, ChevronRight, CircleHelp, CreditCard, Eye, EyeOff, FileText, Home as HomeIcon, Menu, Moon, MoreHorizontal, Plus, QrCode, Search, Settings, ShieldCheck, Sun, TrendingUp, User, Wallet, X } from 'lucide-react';
import './styles.css';

const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const accountNumber = () => String(Math.floor(1000000000 + Math.random() * 8999999999));
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const navigation = [
  ['home', 'Home', HomeIcon], ['payments', 'Payments', Wallet], ['investments', 'Investments', TrendingUp], ['support', 'Support', CircleHelp], ['profile', 'Profile', User]
];
const quickActions = [
  ['transfer', 'Transfer', ArrowLeftRight], ['withdraw', 'Withdraw', ArrowDownToLine], ['add', 'Add money', Plus], ['pay', 'Pay bills', FileText], ['cards', 'Cards', CreditCard], ['scan', 'Scan to Pay', QrCode]
];

const freshMember = () => ({ id: 'member-1', name: 'AetherBank Member', accountNumber: accountNumber(), checking: 0, savings: 0 });
const safeLoad = () => {
  const fallback = { member: freshMember(), members: [], transactions: [], theme: 'light', notifications: true };
  try {
    const raw = window.localStorage.getItem('aetherbank-state');
    if (!raw) return fallback;
    const saved = JSON.parse(raw);
    const base = saved && typeof saved === 'object' ? saved : {};
    const member = { ...fallback.member, ...(base.member || {}) };
    if (!member.accountNumber) member.accountNumber = accountNumber();
    const members = Array.isArray(base.members) ? base.members.map((m) => ({ ...member, ...m, accountNumber: m?.accountNumber || accountNumber() })) : [];
    const allMembers = members.some((m) => m.id === member.id) ? members : [member, ...members];
    return { member, members: allMembers, transactions: Array.isArray(base.transactions) ? base.transactions : [], theme: base.theme === 'dark' ? 'dark' : 'light', notifications: base.notifications !== false };
  } catch {
    return fallback;
  }
};
const safeSave = (state) => { try { window.localStorage.setItem('aetherbank-state', JSON.stringify(state)); } catch {} };

function App() {
  const initial = safeLoad();
  const [member, setMember] = useState(initial.member);
  const [members, setMembers] = useState(initial.members.length ? initial.members : [initial.member]);
  const [transactions, setTransactions] = useState(initial.transactions);
  const [theme, setTheme] = useState(initial.theme);
  const [notifications, setNotifications] = useState(initial.notifications);
  const [page, setPage] = useState('home');
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [message, setMessage] = useState('');

  const total = member.checking + member.savings;
  const cardSpend = useMemo(() => transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0), [transactions]);
  const show = (value) => hideBalance ? '••••••' : money(value);
  const save = (m = member, ms = members, tx = transactions, th = theme, notes = notifications) => safeSave({ member: m, members: ms, transactions: tx, theme: th, notifications: notes });
  const flash = (text) => { setMessage(text); window.setTimeout(() => setMessage(''), 2500); };
  const changeTheme = (value) => { setTheme(value); save(member, members, transactions, value, notifications); };
  const changeNotifications = (value) => { setNotifications(value); save(member, members, transactions, theme, value); };

  const addMoney = (amount) => {
    if (!(amount > 0)) return flash('Enter a valid amount.');
    const next = { ...member, checking: member.checking + amount };
    const tx = { id: id(), merchant: 'Account funding', note: 'Checking deposit', amount, date: 'Just now' };
    const txs = [tx, ...transactions]; setMember(next); setTransactions(txs); save(next, members, txs); setModal(null); flash(`${money(amount)} added.`);
  };
  const transfer = (amount, recipientNumber) => {
    const value = Number(amount);
    const recipient = members.find(m => m.accountNumber === recipientNumber && m.id !== member.id);
    if (!(value > 0)) return flash('Enter a valid transfer amount.');
    if (!recipient) return flash('Recipient account was not found.');
    if (value > member.checking) return flash('Transfer declined — available balance is $0.00.');
    const nextMember = { ...member, checking: member.checking - value };
    const nextRecipient = { ...recipient, checking: recipient.checking + value };
    const nextMembers = members.map(m => m.id === member.id ? nextMember : m.id === recipient.id ? nextRecipient : m);
    const txs = [{ id: id(), merchant: recipient.name, note: `Transfer to ${recipient.accountNumber}`, amount: -value, date: 'Just now' }, ...transactions];
    setMember(nextMember); setMembers(nextMembers); setTransactions(txs); save(nextMember, nextMembers, txs); setModal(null); flash('Transfer completed.');
  };
  const debit = (amount, merchant) => {
    const value = Number(amount);
    if (!(value > 0)) return flash('Enter a valid amount.');
    if (value > member.checking) return flash('Payment declined — available balance is $0.00.');
    const next = { ...member, checking: member.checking - value };
    const txs = [{ id: id(), merchant, note: 'Account payment', amount: -value, date: 'Just now' }, ...transactions];
    setMember(next); setTransactions(txs); save(next, members, txs); setModal(null); flash('Payment completed.');
  };
  const register = (name) => {
    if (!name.trim()) return flash('Enter the member name.');
    const newMember = { id: id(), name: name.trim(), accountNumber: accountNumber(), checking: 0, savings: 0 };
    const nextMembers = [...members, newMember]; setMembers(nextMembers); save(member, nextMembers, transactions); setModal(null); flash(`Account created: ${newMember.accountNumber}`);
  };

  return <div className={`app ${theme}`}>
    <div className="phone-shell">
      <header className="topbar">
        <button className="icon-button" onClick={() => setDrawer(true)}><Menu size={25} /></button>
        <button className="brand" onClick={() => setPage('home')}><span className="brand-mark">AE</span><strong>AetherBank</strong></button>
        <button className="icon-button notification-button" onClick={() => changeNotifications(!notifications)}>{notifications ? <Bell size={23} /> : <BellOff size={23} />}{notifications && <i />}</button>
      </header>

      <main className="content">
        {page === 'home' && <Home member={member} show={show} total={total} hideBalance={hideBalance} setHideBalance={setHideBalance} cardSpend={cardSpend} transactions={transactions} open={setModal} />}
        {page === 'payments' && <Payments open={setModal} transactions={transactions} />}
        {page === 'investments' && <Investments open={setModal} />}
        {page === 'support' && <Support flash={flash} />}
        {page === 'profile' && <Profile member={member} theme={theme} changeTheme={changeTheme} notifications={notifications} changeNotifications={changeNotifications} open={setModal} />}
      </main>

      <footer className="bottom-nav">
        {navigation.map(([key, label, Icon]) => <button key={key} className={page === key ? 'active' : ''} onClick={() => setPage(key)}><Icon size={22} /><span>{label}</span></button>)}
      </footer>

      {drawer && <Drawer close={() => setDrawer(false)} page={page} setPage={setPage} settings={() => { setDrawer(false); setModal('settings'); }} />}
      {modal && <Modal type={modal} close={() => setModal(null)} member={member} members={members} addMoney={addMoney} transfer={transfer} debit={debit} register={register} theme={theme} changeTheme={changeTheme} notifications={notifications} changeNotifications={changeNotifications} transactions={transactions} />}
      {message && <div className="toast"><Check size={17} />{message}</div>}
    </div>
  </div>;
}

function Home({ member, show, total, hideBalance, setHideBalance, cardSpend, transactions, open }) {
  return <>
    <section className="hero-card">
      <div className="balance-row"><div><p>Personal Checking</p><small>Available: {show(member.checking)}</small></div><strong>{show(member.checking)}</strong></div>
      <div className="divider" />
      <div className="balance-row"><div><p>Savings</p><small>Available to save</small></div><strong>{show(member.savings)}</strong></div>
      <div className="card-row">
        <div className="bank-card"><div className="mini-brand"><span>AE</span>AetherBank</div><div className="chip" /><div className="contactless">⌁</div><div className="card-name">{member.name}</div><div className="last-four">•••• {member.accountNumber.slice(-4)}</div><div className="card-dots"><i /><i /></div></div>
        <div className="spend"><span>Recent Card Spend</span><b>{show(cardSpend)}</b><div className="progress"><i style={{ width: `${Math.min(100, cardSpend / 30)}%` }} /></div><small>Available: {show(member.checking)}</small></div>
      </div>
      <div className="account-line"><ShieldCheck size={14} /> Account number <b>{member.accountNumber}</b></div>
    </section>

    <div className="total-line"><span>Total balance</span><strong>{show(total)}</strong><button onClick={() => setHideBalance(!hideBalance)}>{hideBalance ? <Eye size={17} /> : <EyeOff size={17} />}</button></div>

    <section className="actions-section"><h2>Banking Actions</h2><div className="action-grid">{quickActions.map(([key, label, Icon]) => <button key={key} onClick={() => open(key)}><span><Icon size={23} /></span><b>{label}</b></button>)}<button onClick={() => open('register')}><span><User size={23} /></span><b>Register Member</b></button></div></section>

    <section className="transactions"><div className="section-heading"><h2>Recent Transactions</h2><button onClick={() => open('transactions')}><MoreHorizontal size={20} /></button></div><div className="search"><Search size={18} /><span>Search transactions</span></div>{transactions.length ? transactions.slice(0, 8).map(t => <Transaction key={t.id} item={t} />) : <div className="empty"><div className="empty-icon"><Wallet size={22} /></div><div><b>No transactions yet</b><p>Your transaction history will appear here.</p></div></div>}</section>
  </>;
}

function Transaction({ item }) { const positive = item.amount > 0; return <div className="transaction"><div className={`merchant-icon ${positive ? 'positive' : ''}`}>{positive ? <Plus size={17} /> : <CreditCard size={17} />}</div><div className="transaction-copy"><b>{item.merchant}</b><span>{item.note} · {item.date}</span></div><strong className={positive ? 'positive-text' : ''}>{positive ? '+' : '−'}{money(Math.abs(item.amount))}</strong></div>; }
function Page({ title, subtitle, children }) { return <section className="page"><h1>{title}</h1><p className="page-subtitle">{subtitle}</p>{children}</section>; }
function Payments({ open, transactions }) { return <Page title="Payments" subtitle="Transfer money, pay bills and manage cards."><div className="feature-grid"><Feature icon={ArrowLeftRight} title="Transfer" text="Send money to another AetherBank member." click={() => open('transfer')} /><Feature icon={FileText} title="Pay Bills" text="Make a payment from your checking account." click={() => open('pay')} /><Feature icon={QrCode} title="Scan to Pay" text="Pay securely with a QR code." click={() => open('scan')} /><Feature icon={CreditCard} title="Cards" text="View your active AetherBank card." click={() => open('cards')} /></div><div className="panel"><h2>Payment Activity</h2>{transactions.length ? transactions.slice(0, 6).map(t => <Transaction key={t.id} item={t} />) : <div className="empty"><b>No payment activity yet.</b></div>}</div></Page>; }
function Feature({ icon: Icon, title, text, click }) { return <button className="feature" onClick={click}><span><Icon size={22} /></span><div><b>{title}</b><p>{text}</p></div><ChevronRight size={18} /></button>; }
function Investments({ open }) { return <Page title="Investments" subtitle="Track your portfolio and future wealth."><div className="investment-card"><small>PORTFOLIO VALUE</small><strong>$0.00</strong><div><TrendingUp size={18} /> 0.00% today</div></div><div className="panel"><div className="section-heading"><h2>Watchlist</h2><button onClick={() => open('invest')}>Manage</button></div><div className="watch-row"><span>Aether Index</span><b>$0.00</b><small>0.00%</small></div><div className="watch-row"><span>Aether Bond</span><b>$0.00</b><small>0.00%</small></div></div></Page>; }
function Support({ flash }) { return <Page title="Support" subtitle="Help with your account and banking services."><div className="support-hero"><div className="support-orb"><CircleHelp size={28} /></div><div><b>AetherBank Support</b><p>Find answers or contact support for account help.</p></div></div>{['How do I register a member?', 'How do internal transfers work?', 'How do I change my theme?', 'How do I manage my card?'].map(q => <button className="list-item" key={q} onClick={() => flash('Support information opened.')}>{q}<ChevronRight size={18} /></button>)}<button className="primary-button" onClick={() => flash('Support request started.')}>Contact Support</button></Page>; }
function Profile({ member, theme, changeTheme, notifications, changeNotifications, open }) { return <Page title="Profile" subtitle="Your AetherBank account and preferences."><div className="profile-card"><div className="avatar">AE</div><div><b>{member.name}</b><p>Account {member.accountNumber}</p></div><ShieldCheck size={20} /></div><div className="panel"><button className="settings-row" onClick={() => open('settings')}><span><Settings size={19} /> Settings</span><ChevronRight size={18} /></button><button className="settings-row" onClick={() => changeNotifications(!notifications)}><span>{notifications ? <Bell size={19} /> : <BellOff size={19} />} Notifications</span><em>{notifications ? 'On' : 'Off'}</em></button><div className="theme-choice"><span>Theme</span><div><button className={theme === 'light' ? 'selected' : ''} onClick={() => changeTheme('light')}><Sun size={16} /> Light</button><button className={theme === 'dark' ? 'selected' : ''} onClick={() => changeTheme('dark')}><Moon size={16} /> Dark</button></div></div></div><div className="security-box"><ShieldCheck size={20} /><div><b>Account Security</b><p>Identity, account and payment controls are managed from your secure banking profile.</p></div></div></Page>; }
function Drawer({ close, setPage, settings }) { return <div className="drawer-backdrop" onClick={close}><aside className="drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><div className="brand"><span className="brand-mark">AE</span><strong>AetherBank</strong></div><button className="icon-button" onClick={close}><X size={22} /></button></div><p className="drawer-label">BANKING</p>{navigation.map(([key, label, Icon]) => <button className="drawer-link" key={key} onClick={() => { setPage(key); close(); }}><Icon size={19} />{label}<ChevronRight size={16} /></button>)}<p className="drawer-label">ACCOUNT</p><button className="drawer-link" onClick={settings}><Settings size={19} />Settings<ChevronRight size={16} /></button></aside></div>; }

function Modal({ type, close, member, members, addMoney, transfer, debit, register, theme, changeTheme, notifications, changeNotifications, transactions }) {
  const [amount, setAmount] = useState(''); const [recipient, setRecipient] = useState(''); const [name, setName] = useState(''); const [payee, setPayee] = useState('Utility bill');
  const titles = { add: 'Add Money', transfer: 'Transfer Money', withdraw: 'Withdraw', pay: 'Pay Bills', cards: 'AetherBank Card', scan: 'Scan to Pay', register: 'Register Member', settings: 'Settings', transactions: 'Transactions', invest: 'Watchlist' };
  const submit = () => { if (type === 'add') addMoney(Number(amount)); else if (type === 'transfer') transfer(Number(amount), recipient); else if (type === 'withdraw') debit(Number(amount), 'ATM withdrawal'); else if (type === 'pay') debit(Number(amount), payee); else if (type === 'scan') debit(Number(amount), 'QR payment'); else if (type === 'register') register(name); };
  return <div className="modal-backdrop" onClick={close}><section className="modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><small>AETHERBANK</small><h2>{titles[type]}</h2></div><button className="icon-button" onClick={close}><X size={21} /></button></div>
    {type === 'settings' && <><div className="setting-block"><b>Appearance</b><p>Switch between the AetherBank light and dark interface.</p><div className="theme-toggle"><button className={theme === 'light' ? 'selected' : ''} onClick={() => changeTheme('light')}><Sun size={17} /> Light</button><button className={theme === 'dark' ? 'selected' : ''} onClick={() => changeTheme('dark')}><Moon size={17} /> Dark</button></div></div><div className="setting-line" onClick={() => changeNotifications(!notifications)}><span><Bell size={18} /><div><b>Notifications</b><small>Account and transaction alerts</small></div></span><span className={`switch ${notifications ? 'on' : ''}`}><i /></span></div><div className="setting-line"><span><ShieldCheck size={18} /><div><b>Security</b><small>Account protection controls</small></div></span><Check size={18} /></div><button className="primary-button" onClick={close}>Done</button></>}
    {type === 'register' && <><label>Member name</label><input className="text-input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Full legal name" /><p className="modal-copy">A unique account number will be issued to every registered AetherBank member.</p><button className="primary-button" onClick={submit}>Create Account</button></>}
    {type === 'transfer' && <><label>Recipient account number</label><input className="text-input" inputMode="numeric" value={recipient} onChange={e => setRecipient(e.target.value.replace(/\D/g, ''))} placeholder="10-digit account number" />{members.filter(m => m.id !== member.id).length > 0 && <div className="member-hint">{members.filter(m => m.id !== member.id).slice(0, 4).map(m => <button key={m.id} onClick={() => setRecipient(m.accountNumber)}>{m.name}<span>{m.accountNumber}</span></button>)}</div>}<label>Amount</label><div className="amount-field"><span>$</span><input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" /></div><div className="transfer-balance"><span>Available balance</span><b>{money(member.checking)}</b></div><button className="primary-button" onClick={submit}>Transfer Money</button></>}
    {(type === 'add' || type === 'withdraw' || type === 'pay' || type === 'scan') && <><label>Amount</label><div className="amount-field"><span>$</span><input autoFocus inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" /></div>{type === 'pay' && <><label>Payee</label><input className="text-input" value={payee} onChange={e => setPayee(e.target.value)} /></>}{type === 'scan' && <div className="qr-placeholder"><QrCode size={82} /><b>Scan to Pay</b><span>Point your camera at a payment QR code.</span></div>}<button className="primary-button" onClick={submit}>{type === 'add' ? 'Add Money' : type === 'withdraw' ? 'Withdraw' : 'Continue'}</button></>}
    {type === 'cards' && <><div className="modal-card"><div className="mini-brand"><span>AE</span>AetherBank</div><div className="chip" /><div className="contactless">⌁</div><b>{member.name}</b><small>•••• {member.accountNumber.slice(-4)}</small></div><div className="info-row"><span>Card status</span><b className="positive-text">Active</b></div><div className="info-row"><span>Available</span><b>{money(member.checking)}</b></div><button className="primary-button" onClick={close}>Done</button></>}
    {type === 'transactions' && <>{transactions.length ? transactions.map(t => <Transaction key={t.id} item={t} />) : <div className="empty"><b>No transactions yet</b></div>}<button className="primary-button" onClick={close}>Close</button></>}
    {type === 'invest' && <><div className="watch-row"><span>Aether Index</span><b>$0.00</b><small>0.00%</small></div><div className="watch-row"><span>Aether Bond</span><b>$0.00</b><small>0.00%</small></div><button className="primary-button" onClick={close}>Done</button></>}
  </section></div>;
}

createRoot(document.getElementById('root')).render(<App />);
