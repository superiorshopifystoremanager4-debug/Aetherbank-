import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LockKeyhole, ArrowDownToLine, ArrowLeftRight, Bell, BellOff, Check, ChevronRight, CircleDollarSign, CircleHelp, Clock3, Copy, CreditCard, Eye, EyeOff, FileText, Home as HomeIcon, Landmark, Menu, Moon, MoreHorizontal, Plus, QrCode, RotateCcw, Search, Settings, ShieldCheck, ShoppingBag, Sun, TrendingUp, Truck, Utensils, User, Wallet, X, Zap } from 'lucide-react';
import './styles.css';

const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const accountNumber = () => String(Math.floor(1000000000 + Math.random() * 8999999999));
// Clearly fictional demo-only card and bank identifiers. Never use these for real payments.
const DEMO_CARD_NUMBER = '5312448899003711';
const DEMO_CARD_EXPIRY = '08/29';
const DEMO_CARD_CVV = '482';
const DEMO_ROUTING_NUMBER = '000000000';
const DEMO_SWIFT_CODE = 'AETHUS33XXX';
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const bottomNavigation = [['home', 'Home', HomeIcon], ['payments', 'Payments', Wallet], ['cards', 'Cards', CreditCard], ['profile', 'Profile', User]];
const secondaryNavigation = [['investments', 'Investments', TrendingUp], ['support', 'Support', CircleHelp]];
const quickActions = [['transfer', 'Transfer', ArrowLeftRight], ['withdraw', 'Withdraw', ArrowDownToLine], ['pay', 'Pay Bills', FileText], ['cards', 'Cards', CreditCard]];


const usBanks = [
  'JPMorgan Chase Bank', 'Bank of America', 'Wells Fargo Bank', 'Citibank', 'Capital One', 'U.S. Bank', 'PNC Bank', 'Truist Bank', 'TD Bank', 'Goldman Sachs Bank USA', 'Fifth Third Bank', 'Regions Bank', 'KeyBank', 'Citizens Bank', 'Ally Bank', 'Discover Bank', 'American Express National Bank', 'Huntington National Bank', 'BMO Bank', 'First Citizens Bank'
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
  const [physicalFrozen, setPhysicalFrozen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

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
    const nextMembers = [...members, newMember]; setMembers(nextMembers); save(member, nextMembers, transactions); setModal(null); flash(`Account created ending ${newMember.accountNumber.slice(-4)}.`);
  };

  return <div className={`app ${theme}`}>
    <div className="phone-shell">
      <header className="topbar">
        <button className="icon-button" aria-label="Open secondary menu" onClick={() => setDrawer(true)}><Menu size={22} /></button>
        <button className="brand" onClick={() => { setPage('home'); setModal(null); }}><span className="brand-mark">AE</span><strong>AetherBank</strong></button>
        <div className="header-tools"><button className="icon-button" aria-label="Search transactions" onClick={() => { setGlobalSearch(''); setModal('search'); }}><Search size={20} /></button><button className="icon-button notification-button" aria-label="Toggle notifications" onClick={() => changeNotifications(!notifications)}>{notifications ? <Bell size={20} /> : <BellOff size={20} />}{notifications && <i />}</button><button className="icon-button" aria-label="Open settings" onClick={() => setModal('settings')}><Settings size={20} /></button></div>
      </header>

      <main className="content">
        {page === 'home' && <Home member={member} show={show} total={total} hideBalance={hideBalance} setHideBalance={setHideBalance} cardSpend={cardSpend} transactions={transactions} open={setModal} />}
        {page === 'payments' && <Payments open={setModal} transactions={transactions} flash={flash} />}
        {page === 'investments' && <Investments open={setModal} />}
        {page === 'support' && <Support flash={flash} />}
        {page === 'profile' && <Profile member={member} theme={theme} changeTheme={changeTheme} notifications={notifications} changeNotifications={changeNotifications} open={setModal} />}
      </main>

      <footer className="bottom-nav">{bottomNavigation.map(([key, label, Icon]) => <button key={key} className={(modal === 'cards' ? key === 'cards' : page === key) ? 'active' : ''} onClick={() => { if (key === 'cards') { setModal('cards'); return; } setModal(null); setPage(key); }}><Icon size={21} /><span>{label}</span></button>)}</footer>

      {drawer && <Drawer close={() => setDrawer(false)} page={page} setPage={setPage} settings={() => { setDrawer(false); setModal('settings'); }} />}
      {modal && <Modal type={modal} close={() => setModal(null)} open={setModal} member={member} members={members} addMoney={addMoney} transfer={transfer} debit={debit} register={register} theme={theme} changeTheme={changeTheme} notifications={notifications} changeNotifications={changeNotifications} transactions={transactions} flash={flash} physicalFrozen={physicalFrozen} setPhysicalFrozen={setPhysicalFrozen} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} />}
      {message && <div className="toast"><Check size={17} />{message}</div>}
    </div>
  </div>;
}

function Home({ member, show, total, hideBalance, setHideBalance, cardSpend, transactions, open }) {
  return <>
    <section className="hero-card">
      <div className="balance-heading"><div><span className="eyebrow">TOTAL RELATIONSHIP BALANCE</span><p>Personal accounts</p></div><button className="balance-visibility" aria-label={hideBalance ? 'Show balances' : 'Hide balances'} onClick={() => setHideBalance(!hideBalance)}>{hideBalance ? <Eye size={18}/> : <EyeOff size={18}/>}</button></div>
      <div className="balance-row"><div><p>Personal Checking</p><small>Available balance</small></div><strong>{show(member.checking)}</strong></div><div className="divider" />
      <div className="balance-row"><div><p>Savings</p><small>Available to save</small></div><strong>{show(member.savings)}</strong></div>
      <div className="account-line"><ShieldCheck size={14} /> Checking account <b>••••{member.accountNumber.slice(-5)}</b></div>
    </section>
    <button className="account-details-link" onClick={() => open('account-details')}><span><ShieldCheck size={17}/><span><b>Account Details</b><small>Routing, account and bank information</small></span></span><ChevronRight size={18}/></button>
    <section className="dashboard-card-section"><div className="section-heading"><div><h2>Cards & spending</h2><p>Keep track of your everyday spending</p></div><button onClick={() => open('cards')}>Manage <ChevronRight size={16}/></button></div><div className="card-row">
      <button className="bank-card dashboard-bank-card" onClick={() => open('cards')} aria-label="Manage debit card"><div className="mini-brand"><span>AE</span>AetherBank</div><div className="chip" /><div className="contactless">⌁</div><div className="card-name">{member.name}</div><div className="last-four">•••• {DEMO_CARD_NUMBER.slice(-4)}</div><div className="card-dots"><i /><i /></div></button>
      <div className="spend"><span>Recent card spend</span><b>{show(cardSpend)}</b><div className="progress"><i style={{ width: `${Math.min(100, cardSpend / 30)}%` }} /></div><small>Checking available: {show(member.checking)}</small></div>
    </div><p className="demo-card-note">Demo card · no live payment connection</p></section>

    <section className="actions-section"><div className="section-heading"><h2>Banking Actions</h2><span className="section-caption">Quick access</span></div><div className="action-grid">{quickActions.map(([key, label, Icon]) => <button key={key} onClick={() => open(key)}><span><Icon size={22} /></span><b>{label}</b></button>)}</div></section>

    <section className="transactions"><div className="section-heading"><h2>Recent Transactions</h2><button onClick={() => open('transactions')}><MoreHorizontal size={20} /></button></div><div className="search"><Search size={18} /><span>Search transactions</span></div>{transactions.length ? transactions.slice(0, 8).map(t => <Transaction key={t.id} item={t} />) : <div className="empty"><div className="empty-icon"><Wallet size={22} /></div><div><b>No transactions yet</b><p>Your transaction history will appear here.</p></div></div>}</section>
  </>;
}

function Transaction({ item }) {
  const positive = item.amount > 0;
  const label = `${item.merchant || ''} ${item.note || ''}`.toLowerCase();
  const Icon = /transfer|account funding|deposit|payroll|salary/.test(label) ? Landmark : /grocery|market|shop|store|retail/.test(label) ? ShoppingBag : /cafe|coffee|restaurant|food|dining/.test(label) ? Utensils : /electric|utility|bill|power/.test(label) ? Zap : /atm|withdraw|cash/.test(label) ? CircleDollarSign : CreditCard;
  const status = item.status === 'pending' ? 'Pending' : 'Completed';
  return <div className="transaction"><div className={`merchant-icon ${positive ? 'positive' : ''}`}><Icon size={18}/></div><div className="transaction-copy"><div className="transaction-title-row"><b>{item.merchant || 'Account activity'}</b><span className={`transaction-status ${status.toLowerCase()}`}>{status}</span></div><span className="transaction-meta">{item.note || (positive ? 'Incoming credit' : 'Card payment')} <i>·</i> <Clock3 size={11}/>{item.date || 'Date unavailable'}</span></div><strong className={`transaction-amount ${positive ? 'positive-text' : ''}`}>{positive ? '+' : '−'}{money(Math.abs(item.amount))}</strong></div>;
}
function Page({ title, subtitle, children }) { return <section className="page"><h1>{title}</h1><p className="page-subtitle">{subtitle}</p>{children}</section>; }
function Payments({ open, transactions }) { return <Page title="Payments" subtitle="Transfer money, pay bills and manage cards."><div className="feature-grid"><Feature icon={ArrowLeftRight} title="Transfer" text="Send money to another AetherBank member." click={() => open('transfer')} /><Feature icon={FileText} title="Pay Bills" text="Make a payment from your checking account." click={() => open('pay')} /><Feature icon={QrCode} title="Scan to Pay" text="Pay securely with a QR code." click={() => open('scan')} /><Feature icon={CreditCard} title="Cards" text="View your active AetherBank card." click={() => open('cards')} /></div><div className="panel"><h2>Payment Activity</h2>{transactions.length ? transactions.slice(0, 6).map(t => <Transaction key={t.id} item={t} />) : <div className="empty"><b>No payment activity yet.</b></div>}</div></Page>; }
function Feature({ icon: Icon, title, text, click }) { return <button className="feature" onClick={click}><span><Icon size={22} /></span><div><b>{title}</b><p>{text}</p></div><ChevronRight size={18} /></button>; }
function Investments({ open }) { return <Page title="Investments" subtitle="Track your portfolio and future wealth."><div className="investment-card"><small>PORTFOLIO VALUE</small><strong>$0.00</strong><div><TrendingUp size={18} /> 0.00% today</div></div><div className="panel"><div className="section-heading"><h2>Watchlist</h2><button onClick={() => open('invest')}>Manage</button></div><div className="watch-row"><span>Aether Index</span><b>$0.00</b><small>0.00%</small></div><div className="watch-row"><span>Aether Bond</span><b>$0.00</b><small>0.00%</small></div></div></Page>; }
function Support({ flash }) {
  const [expanded, setExpanded] = useState(0);
  const faqs = [
    ['How do internal and wire transfers work?', 'Internal transfers between accounts at the same institution are often processed quickly. Wire transfers move through banking networks and may have fees, cut-off times, and additional verification. Availability depends on your bank and destination. This demo does not send transfers.'],
    ['What are my daily transaction and ATM limits?', 'Daily purchase, transfer, and ATM limits vary by account, card, and institution. Check your official account agreement or contact your bank for your actual limits. Any limits shown in this prototype are illustrative only.'],
    ['How do I lock or report a lost card?', 'Use your bank’s official app or phone number to lock a missing card immediately, then contact the bank to report it and request a replacement. The Freeze control in this demo only changes the preview state and does not block real transactions.'],
    ['When do direct deposits post to my checking account?', 'Posting time depends on when the sender submits the payment, the receiving bank’s processing schedule, and holidays. Ask your payroll provider or bank for deposit-specific timing; this prototype cannot receive actual direct deposits.']
  ];
  return <Page title="Support" subtitle="Guidance for everyday banking and account security."><div className="support-hero"><div className="support-orb"><CircleHelp size={26} /></div><div><b>How can we help?</b><p>Browse common banking questions or reach the support team.</p></div></div><div className="faq-list">{faqs.map(([q,a],i) => <section className={`faq-item ${expanded === i ? 'expanded' : ''}`} key={q}><button className="faq-question" aria-expanded={expanded === i} onClick={() => setExpanded(expanded === i ? -1 : i)}><span>{q}</span><ChevronRight size={18}/></button>{expanded === i && <p className="faq-answer">{a}</p>}</section>)}</div><button className="primary-button" onClick={() => flash('Support request is a preview only. No support agent is connected.')}>Contact Support</button><p className="support-disclaimer">AetherBank is a UI prototype. For real account issues, contact your bank using its official contact details.</p></Page>;
}
function Profile({ member, theme, changeTheme, notifications, changeNotifications, open }) { return <Page title="Profile" subtitle="Your AetherBank account and preferences."><div className="profile-card"><div className="avatar">AE</div><div><b>{member.name}</b><p>Account ••••{member.accountNumber.slice(-5)}</p></div><ShieldCheck size={20} /></div><div className="panel"><button className="settings-row" onClick={() => open('settings')}><span><Settings size={19} /> Settings</span><ChevronRight size={18} /></button><button className="settings-row" onClick={() => changeNotifications(!notifications)}><span>{notifications ? <Bell size={19} /> : <BellOff size={19} />} Notifications</span><em>{notifications ? 'On' : 'Off'}</em></button><div className="theme-choice"><span>Theme</span><div><button className={theme === 'light' ? 'selected' : ''} onClick={() => changeTheme('light')}><Sun size={16} /> Light</button><button className={theme === 'dark' ? 'selected' : ''} onClick={() => changeTheme('dark')}><Moon size={16} /> Dark</button></div></div></div><div className="security-box"><ShieldCheck size={20} /><div><b>Account Security</b><p>Identity, account and payment controls are managed from your secure banking profile.</p></div></div></Page>; }
function Drawer({ close, setPage, settings }) { return <div className="drawer-backdrop" onClick={close}><aside className="drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><div className="brand"><span className="brand-mark">AE</span><strong>AetherBank</strong></div><button className="icon-button" aria-label="Close menu" onClick={close}><X size={22} /></button></div><p className="drawer-label">EXPLORE</p>{secondaryNavigation.map(([key, label, Icon]) => <button className="drawer-link" key={key} onClick={() => { setPage(key); close(); }}><Icon size={19} />{label}<ChevronRight size={16} /></button>)}<div className="drawer-demo"><ShieldCheck size={18}/><span><b>Account protected</b><small>Search, notifications and settings are available in the top bar.</small></span></div></aside></div>; }

function Modal({ type, close, open, member, members, addMoney, transfer, debit, register, theme, changeTheme, notifications, changeNotifications, transactions, flash, physicalFrozen, setPhysicalFrozen, globalSearch, setGlobalSearch }) {
  const [amount, setAmount] = useState(''); const [recipient, setRecipient] = useState(''); const [name, setName] = useState(''); const [payee, setPayee] = useState('Utility bill');
  const [bankSearch, setBankSearch] = useState(''); const [selectedBank, setSelectedBank] = useState(''); const [recipientName, setRecipientName] = useState(''); const [accountLast4, setAccountLast4] = useState(''); const [reviewTransfer, setReviewTransfer] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState('Account preferences');
  const [cardTab, setCardTab] = useState('virtual');
  const [showVirtualDetails, setShowVirtualDetails] = useState(false);
  const copyValue = async (value, label) => { try { await navigator.clipboard.writeText(value); flash(`${label} copied.`); } catch { flash('Clipboard access is unavailable in this browser.'); } };
  const [settingsPrefs, setSettingsPrefs] = useState({ currency: 'USD ($)', timezone: 'Eastern Time (ET)', dateFormat: 'MM/DD/YYYY', dailyLimit: '2500', paperless: true, marketing: false });
  const updateSettings = (key, value) => setSettingsPrefs(current => ({ ...current, [key]: value }));
  const titles = { search: 'Search activity', add: 'Add Money', transfer: 'Transfer to a US bank', withdraw: 'Withdraw', pay: 'Pay Bills', cards: 'Card Management', 'virtual-card-details': 'Virtual Card Details', 'physical-card-details': 'Physical Card Details', 'account-details': 'Account Details', scan: 'Scan to Pay', register: 'Register Member', settings: 'Settings', transactions: 'Transactions', invest: 'Watchlist' };
  const submit = () => { if (type === 'add') addMoney(Number(amount)); else if (type === 'transfer') transfer(Number(amount), recipient); else if (type === 'withdraw') debit(Number(amount), 'ATM withdrawal'); else if (type === 'pay') debit(Number(amount), payee); else if (type === 'scan') debit(Number(amount), 'QR payment'); else if (type === 'register') register(name); };
  return <div className="modal-backdrop" onClick={close}><section className="modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><small>AETHERBANK</small><h2>{titles[type]}</h2></div><button className="icon-button" onClick={close}><X size={21} /></button></div>
    {type === 'settings' && <div className="settings-details">
      <div className="settings-intro"><div className="settings-icon"><Settings size={22} /></div><div><b>Account settings</b><p>Manage preferences, account information and protection.</p></div></div>
      <section className="settings-group"><div className="settings-group-title"><User size={18}/><div><b>Personal information</b><small>Details saved in this browser</small></div></div>
        <div className="settings-detail"><span>Full name</span><b>{member.name}</b></div><div className="settings-detail"><span>Account number</span><b>••••{member.accountNumber.slice(-5)}</b></div><div className="settings-detail"><span>Email address</span><b className="settings-muted">Not provided</b></div><div className="settings-detail"><span>Phone number</span><b className="settings-muted">Not provided</b></div>
      </section>
      <section className="settings-group"><div className="settings-group-title"><Wallet size={18}/><div><b>Account details</b><small>Account overview and currency</small></div></div>
        <div className="settings-detail"><span>Account type</span><b>Personal checking</b></div><div className="settings-detail"><span>Checking balance</span><b>{money(member.checking)}</b></div><div className="settings-detail"><span>Savings balance</span><b>{money(member.savings)}</b></div><div className="settings-detail"><span>Display currency</span><b>USD · US Dollar ($)</b></div><div className="settings-detail"><span>Routing number</span><b className="settings-muted">Not configured</b></div><p className="settings-footnote">This interface is not connected to a real financial institution.</p>
      </section>
      <section className="settings-group"><button className="settings-group-title settings-group-button" aria-expanded={settingsExpanded === 'Account preferences'} onClick={() => setSettingsExpanded(settingsExpanded === 'Account preferences' ? '' : 'Account preferences')}><Settings size={18}/><div><b>Account preferences</b><small>Currency, time zone and date display</small></div><ChevronRight size={17}/></button>
        {settingsExpanded === 'Account preferences' && <div className="settings-extra-grid">
          <label>Display currency<select value={settingsPrefs.currency} onChange={e => updateSettings('currency',e.target.value)}><option>USD ($)</option><option>EUR (€)</option><option>GBP (£)</option></select></label>
          <label>Time zone<select value={settingsPrefs.timezone} onChange={e => updateSettings('timezone',e.target.value)}><option>Eastern Time (ET)</option><option>Central Time (CT)</option><option>Mountain Time (MT)</option><option>Pacific Time (PT)</option><option>UTC</option></select></label>
          <label>Date format<select value={settingsPrefs.dateFormat} onChange={e => updateSettings('dateFormat',e.target.value)}><option>MM/DD/YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option></select></label>
          <p className="settings-footnote">Preview preferences only. Changing display currency does not convert funds.</p>
        </div>}
      </section>
      <section className="settings-group"><button className="settings-group-title settings-group-button" aria-expanded={settingsExpanded === 'Security & sign-in'} onClick={() => setSettingsExpanded(settingsExpanded === 'Security & sign-in' ? '' : 'Security & sign-in')}><ShieldCheck size={18}/><div><b>Security & sign-in</b><small>Password and multi-factor protection</small></div><ChevronRight size={17}/></button>
        {settingsExpanded === 'Security & sign-in' && <div className="settings-extra-grid"><p className="settings-footnote">A secure sign-in service is not connected. Password changes and multi-factor authentication cannot be activated from this preview. Never enter a password or one-time code here.</p></div>}
      </section>
      <section className="settings-group"><div className="settings-group-title"><Bell size={18}/><div><b>Notifications</b><small>Account and transaction alerts</small></div></div><button className="setting-line" onClick={() => changeNotifications(!notifications)}><span><div><b>Account & transaction alerts</b><small>Preference saved on this device</small></div></span><span className={`switch ${notifications ? 'on' : ''}`}><i/></span></button></section>
      <section className="settings-group"><button className="settings-group-title settings-group-button" aria-expanded={settingsExpanded === 'Payment preferences'} onClick={() => setSettingsExpanded(settingsExpanded === 'Payment preferences' ? '' : 'Payment preferences')}><Wallet size={18}/><div><b>Payments & limits</b><small>Review preferred daily transfer limit</small></div><ChevronRight size={17}/></button>
        {settingsExpanded === 'Payment preferences' && <div className="settings-extra-grid"><label>Preferred daily limit (USD)<input inputMode="numeric" value={settingsPrefs.dailyLimit} onChange={e => updateSettings('dailyLimit',e.target.value.replace(/[^0-9]/g,''))}/></label><p className="settings-footnote">This preference is not an active bank limit. Actual transfers are not connected.</p></div>}
      </section>
      <section className="settings-group"><button className="settings-group-title settings-group-button" aria-expanded={settingsExpanded === 'Privacy & consent'} onClick={() => setSettingsExpanded(settingsExpanded === 'Privacy & consent' ? '' : 'Privacy & consent')}><LockKeyhole size={18}/><div><b>Privacy & consent</b><small>Paperless delivery and optional updates</small></div><ChevronRight size={17}/></button>
        {settingsExpanded === 'Privacy & consent' && <div className="settings-extra-grid"><label className="settings-check-row"><span><b>Paperless statements</b><small>Digital delivery preference</small></span><input type="checkbox" checked={settingsPrefs.paperless} onChange={e => updateSettings('paperless',e.target.checked)}/></label><label className="settings-check-row"><span><b>Optional product updates</b><small>Non-essential announcements</small></span><input type="checkbox" checked={settingsPrefs.marketing} onChange={e => updateSettings('marketing',e.target.checked)}/></label><p className="settings-footnote">These consent choices are preview-only and are not sent to a real account service.</p></div>}
      </section>
      <section className="settings-group"><div className="settings-group-title"><Sun size={18}/><div><b>Appearance</b><small>Personalize the interface</small></div></div><div className="theme-toggle settings-theme-toggle"><button className={theme === 'light' ? 'selected' : ''} onClick={() => changeTheme('light')}><Sun size={17}/> Light</button><button className={theme === 'dark' ? 'selected' : ''} onClick={() => changeTheme('dark')}><Moon size={17}/> Dark</button></div></section>
      <section className="settings-group"><div className="settings-group-title"><FileText size={18}/><div><b>Statements & documents</b><small>Account records</small></div></div><div className="settings-detail"><span>Statements</span><b className="settings-muted">No statements available</b></div><div className="settings-detail"><span>Tax documents</span><b className="settings-muted">Not available</b></div></section>
      <section className="settings-group"><div className="settings-group-title"><CircleHelp size={18}/><div><b>Help & support</b><small>Support options</small></div></div><p className="settings-footnote">Support is not connected. Do not share sensitive financial information in this preview.</p></section>
      <p className="settings-disclaimer">Prototype notice: settings can be previewed here, but this interface does not connect to a real bank or move real money.</p><button className="primary-button" onClick={close}>Done</button>
    </div>}
    {type === 'register' && <><label>Member name</label><input className="text-input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Full legal name" /><p className="modal-copy">A unique account number will be issued to every registered AetherBank member.</p><button className="primary-button" onClick={submit}>Create Account</button></>}
    {type === 'transfer' && <>
      {!reviewTransfer ? <>
        <div className="bank-flow-note"><ShieldCheck size={17}/><span><b>US bank transfer preview</b><small>Choose a bank and review the details. This preview does not connect to a bank or send money.</small></span></div>
        <label>Search US banks</label><div className="bank-search-field"><Search size={17}/><input className="text-input" value={bankSearch} onChange={e => setBankSearch(e.target.value)} placeholder="Search Chase, Wells Fargo, Citi…" /></div>
        <div className="bank-list" role="listbox" aria-label="US banks">{usBanks.filter(bank => bank.toLowerCase().includes(bankSearch.toLowerCase())).map(bank => <button type="button" key={bank} className={selectedBank === bank ? 'bank-option selected' : 'bank-option'} onClick={() => setSelectedBank(bank)} aria-selected={selectedBank === bank}><span className="bank-monogram">{bank.split(/\\s+/).filter(Boolean).slice(0,2).map(word => word[0]).join('').slice(0,2)}</span><span><b>{bank}</b><small>United States</small></span><span className="bank-radio">{selectedBank === bank ? '✓' : ''}</span></button>)}{usBanks.filter(bank => bank.toLowerCase().includes(bankSearch.toLowerCase())).length === 0 && <p className="settings-footnote">No matching bank found. Try another name.</p>}</div>
        <label>Recipient name (optional)</label><input className="text-input" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Name on recipient account" />
        <label>Account last four digits (optional)</label><input className="text-input" inputMode="numeric" maxLength={4} value={accountLast4} onChange={e => setAccountLast4(e.target.value.replace(/\\D/g, '').slice(0,4))} placeholder="••••" />
        <label>Transfer amount (USD)</label><div className="amount-field"><span>$</span><input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" /></div>
        <div className="transfer-balance"><span>Displayed checking balance</span><b>{money(member.checking)}</b></div><button className="primary-button" onClick={() => { if (!selectedBank) return flash('Choose a US bank first.'); if (!(Number(amount) > 0)) return flash('Enter a valid amount.'); setReviewTransfer(true); }}>Review transfer</button>
      </> : <>
        <div className="review-badge"><ShieldCheck size={22}/><b>Review transfer details</b></div><div className="bank-review-card"><div className="info-row"><span>Destination bank</span><b>{selectedBank}</b></div><div className="info-row"><span>Recipient</span><b>{recipientName.trim() || 'Not provided'}</b></div><div className="info-row"><span>Account ending</span><b>{accountLast4 ? '•••• ' + accountLast4 : 'Not provided'}</b></div><div className="info-row"><span>Amount</span><b>{money(Number(amount))}</b></div><div className="info-row"><span>Transfer fee</span><b>$0.00 (preview)</b></div><div className="info-row"><span>Total</span><b>{money(Number(amount))}</b></div></div><p className="settings-footnote">This is a review-only simulation. Confirming will not debit your balance, contact the selected bank, or create a real transfer.</p><button className="primary-button" onClick={() => { close(); flash('Preview complete — no money was moved and no bank was contacted.'); }}>Confirm preview (no money sent)</button><button className="secondary-button" onClick={() => setReviewTransfer(false)}>Back to edit details</button>
      </>}
    </>}
    {(type === 'add' || type === 'withdraw' || type === 'pay' || type === 'scan') && <><label>Amount</label><div className="amount-field"><span>$</span><input autoFocus inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" /></div>{type === 'pay' && <><label>Payee</label><input className="text-input" value={payee} onChange={e => setPayee(e.target.value)} /></>}{type === 'scan' && <div className="qr-placeholder"><QrCode size={82} /><b>Scan to Pay</b><span>Point your camera at a payment QR code.</span></div>}<button className="primary-button" onClick={submit}>{type === 'add' ? 'Add Money' : type === 'withdraw' ? 'Withdraw' : 'Continue'}</button></>}
    {type === 'account-details' && <div className="account-details-content">
      <div className="bank-flow-note"><ShieldCheck size={18}/><span><b>Private account information</b><small>Demo values only. AetherBank is not connected to a real bank; do not use these details for transfers.</small></span></div>
      <div className="account-detail-row"><span>Account type</span><b>Personal Checking</b></div>
      <div className="copy-detail-row"><div><span>Account number</span><b>{member.accountNumber}</b></div><button onClick={() => copyValue(member.accountNumber, 'Account number')}><Copy size={15}/> Copy</button></div>
      <div className="copy-detail-row"><div><span>Routing number (ABA format)</span><b>{DEMO_ROUTING_NUMBER}</b></div><button onClick={() => copyValue(DEMO_ROUTING_NUMBER, 'Routing number')}><Copy size={15}/> Copy</button></div>
      <div className="account-detail-row"><span>Bank name</span><b>AetherBank (fictional demo)</b></div>
      <div className="account-detail-row"><span>SWIFT / BIC</span><b>{DEMO_SWIFT_CODE}</b></div>
      <p className="settings-footnote">The routing number and SWIFT code are illustrative placeholders, not valid payment instructions.</p>
      <button className="primary-button" onClick={close}>Done</button>
    </div>}
    {type === 'cards' && <div className="card-management">
      <div className="segmented card-tabs" role="tablist" aria-label="Card type"><button role="tab" aria-selected={cardTab === 'virtual'} className={cardTab === 'virtual' ? 'selected' : ''} onClick={() => setCardTab('virtual')}>Virtual Card</button><button role="tab" aria-selected={cardTab === 'physical'} className={cardTab === 'physical' ? 'selected' : ''} onClick={() => setCardTab('physical')}>Physical Card</button></div>
      {cardTab === 'virtual' ? <section className="card-management-section">
        <button className="managed-card-preview virtual-card-preview" onClick={() => open('virtual-card-details')} aria-label="Open virtual card details"><span className="card-preview-top"><span className="mini-brand"><span>AE</span>AetherBank</span><span className="card-type-pill">VIRTUAL</span></span><span className="chip"/><span className="contactless">⌁</span><b>{member.name}</b><small>•••• {DEMO_CARD_NUMBER.slice(-4)}</small><span className="card-preview-hint">Tap to manage details <ChevronRight size={14}/></span></button>
        <div className="info-row"><span>Card status</span><b className="positive-text">Active · Demo</b></div>
        <button className="secondary-button card-action-button" onClick={() => setShowVirtualDetails(!showVirtualDetails)}>{showVirtualDetails ? <EyeOff size={16}/> : <Eye size={16}/>} {showVirtualDetails ? 'Hide Card Details' : 'Show Card Details'}</button>
        {showVirtualDetails && <div className="revealed-card-details"><div><span>Card number</span><b>{DEMO_CARD_NUMBER.replace(/(.{4})/g, '$1 ').trim()}</b></div><div><span>Expiration</span><b>{DEMO_CARD_EXPIRY}</b></div><div><span>CVV</span><b>{DEMO_CARD_CVV}</b></div></div>}
        <p className="settings-footnote">Fictional demo card details only. This card cannot be used to make payments.</p>
      </section> : <section className="card-management-section">
        <button className="managed-card-preview physical-card-preview" onClick={() => open('physical-card-details')} aria-label="Open physical card details"><span className="card-preview-top"><span className="mini-brand"><span>AE</span>AetherBank</span><span className="card-type-pill">PHYSICAL</span></span><span className="chip"/><span className="contactless">⌁</span><b>{member.name}</b><small>•••• {DEMO_CARD_NUMBER.slice(-4)}</small><span className="card-preview-hint">Tap to manage card <ChevronRight size={14}/></span></button>
        <div className="info-row"><span>Delivery status</span><b>Not ordered · Demo</b></div>
        <button className="setting-line card-switch-line" onClick={() => setPhysicalFrozen(!physicalFrozen)}><span><span><b>{physicalFrozen ? 'Card frozen' : 'Card active'}</b><small>{physicalFrozen ? 'Demo purchases are marked as blocked' : 'Freeze this demo card if needed'}</small></span></span><span className={`switch ${physicalFrozen ? 'on' : ''}`}><i/></span></button>
        <button className="secondary-button card-action-button" onClick={() => flash('PIN reset is unavailable in this demo. No PIN was changed.')}><RotateCcw size={16}/> Reset PIN</button>
        <p className="settings-footnote">Card freeze and PIN controls are simulated locally and do not affect a real card.</p>
      </section>}
      <button className="primary-button" onClick={close}>Done</button>
    </div>}
    {type === 'virtual-card-details' && <div className="card-detail-modal">
      <div className="managed-card-preview virtual-card-preview detail-card-preview"><span className="card-preview-top"><span className="mini-brand"><span>AE</span>AetherBank</span><span className="card-type-pill">VIRTUAL</span></span><span className="chip"/><span className="contactless">⌁</span><b>{member.name}</b><small>•••• {DEMO_CARD_NUMBER.slice(-4)}</small></div>
      <div className="info-row"><span>Card status</span><b className="positive-text">Active · Demo</b></div>
      <button className="secondary-button card-action-button" onClick={() => setShowVirtualDetails(!showVirtualDetails)}>{showVirtualDetails ? <EyeOff size={16}/> : <Eye size={16}/>} {showVirtualDetails ? 'Hide Card Details' : 'Show Card Details'}</button>
      {showVirtualDetails && <div className="revealed-card-details"><div><span>Card number</span><b>{DEMO_CARD_NUMBER.replace(/(.{4})/g, '$1 ').trim()}</b></div><div><span>Expiration</span><b>{DEMO_CARD_EXPIRY}</b></div><div><span>CVV</span><b>{DEMO_CARD_CVV}</b></div></div>}
      <p className="settings-footnote">Fictional demo details only. No real card is issued or connected.</p><button className="primary-button" onClick={close}>Done</button>
    </div>}
    {type === 'physical-card-details' && <div className="card-detail-modal">
      <div className="managed-card-preview physical-card-preview detail-card-preview"><span className="card-preview-top"><span className="mini-brand"><span>AE</span>AetherBank</span><span className="card-type-pill">PHYSICAL</span></span><span className="chip"/><span className="contactless">⌁</span><b>{member.name}</b><small>•••• {DEMO_CARD_NUMBER.slice(-4)}</small></div>
      <div className="info-row"><span>Delivery status</span><b>Not ordered · Demo</b></div>
      <button className="setting-line card-switch-line" onClick={() => setPhysicalFrozen(!physicalFrozen)}><span><span><b>{physicalFrozen ? 'Card frozen' : 'Card active'}</b><small>{physicalFrozen ? 'Demo purchases are marked as blocked' : 'Freeze this demo card if needed'}</small></span></span><span className={`switch ${physicalFrozen ? 'on' : ''}`}><i/></span></button>
      <button className="secondary-button card-action-button" onClick={() => flash('PIN reset is unavailable in this demo. No PIN was changed.')}><RotateCcw size={16}/> Reset PIN</button>
      <p className="settings-footnote">Freeze and PIN controls are simulated locally. No real card is affected.</p><button className="primary-button" onClick={close}>Done</button>
    </div>}
    {type === 'search' && <div className="global-search-content"><label htmlFor="global-activity-search">Search by merchant, category or description</label><div className="global-search-field"><Search size={18}/><input id="global-activity-search" className="text-input" autoFocus value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} placeholder="e.g. groceries, transfer, bill" /></div>{transactions.filter(t => `${t.merchant || ''} ${t.note || ''}`.toLowerCase().includes(globalSearch.toLowerCase())).length ? transactions.filter(t => `${t.merchant || ''} ${t.note || ''}`.toLowerCase().includes(globalSearch.toLowerCase())).map(t => <Transaction key={t.id} item={t} />) : <div className="empty"><b>No matching activity</b><p>Try a different merchant or description.</p></div>}<button className="primary-button" onClick={close}>Done</button></div>}
    {type === 'transactions' && <>{transactions.length ? transactions.map(t => <Transaction key={t.id} item={t} />) : <div className="empty"><b>No transactions yet</b></div>}<button className="primary-button" onClick={close}>Close</button></>}
    {type === 'invest' && <><div className="watch-row"><span>Aether Index</span><b>$0.00</b><small>0.00%</small></div><div className="watch-row"><span>Aether Bond</span><b>$0.00</b><small>0.00%</small></div><button className="primary-button" onClick={close}>Done</button></>}
  </section></div>;
}

createRoot(document.getElementById('root')).render(<App />);
