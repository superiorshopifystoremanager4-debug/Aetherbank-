import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDownToLine, ArrowLeftRight, ArrowUpRight, Bell, BellOff, Check, ChevronRight,
  CircleHelp, CreditCard, Eye, EyeOff, FileText, Home, Menu, Moon, MoreHorizontal,
  Plus, QrCode, Search, Settings, ShieldCheck, Sun, TrendingUp, User, Wallet, X
} from 'lucide-react';
import './styles.css';

const money = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const quickActions = [
  { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
  { id: 'withdraw', label: 'Withdraw', icon: ArrowDownToLine },
  { id: 'add', label: 'Add money', icon: Plus },
  { id: 'pay', label: 'Pay bills', icon: FileText },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'scan', label: 'Scan to pay', icon: QrCode },
];

const nav = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'payments', label: 'Payments', icon: Wallet },
  { id: 'investments', label: 'Investments', icon: TrendingUp },
  { id: 'support', label: 'Support', icon: CircleHelp },
  { id: 'profile', label: 'Profile', icon: User },
];

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('aether-theme') || 'light');
  const [balances, setBalances] = useState({ checking: 0, savings: 0 });
  const [transactions, setTransactions] = useState([]);
  const [active, setActive] = useState('home');
  const [modal, setModal] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [toast, setToast] = useState('');

  const total = balances.checking + balances.savings;
  const recentSpend = useMemo(() => transactions.filter((t) => t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0), [transactions]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const changeTheme = (value) => {
    setTheme(value);
    localStorage.setItem('aether-theme', value);
  };

  const addMoney = (amount) => {
    setBalances((b) => ({ ...b, checking: b.checking + amount }));
    setTransactions((items) => [{ id: crypto.randomUUID(), merchant: 'Demo deposit', note: 'Added to checking', amount, date: 'Just now' }, ...items]);
    setModal(null);
    showToast(`${money(amount)} added to checking.`);
  };

  const transfer = (amount, direction) => {
    if (amount <= 0) return;
    if (direction === 'checking-to-savings' && amount > balances.checking) return showToast('Not enough checking balance. Your account starts at $0.');
    if (direction === 'savings-to-checking' && amount > balances.savings) return showToast('Not enough savings balance. Your account starts at $0.');
    setBalances((b) => direction === 'checking-to-savings'
      ? { checking: b.checking - amount, savings: b.savings + amount }
      : { checking: b.checking + amount, savings: b.savings - amount });
    setTransactions((items) => [{ id: crypto.randomUUID(), merchant: 'AetherBank transfer', note: direction === 'checking-to-savings' ? 'Checking → Savings' : 'Savings → Checking', amount: 0, date: 'Just now' }, ...items]);
    setModal(null);
    showToast('Transfer completed in demo mode.');
  };

  const spend = (amount, label) => {
    if (amount <= 0) return;
    if (amount > balances.checking) return showToast('Payment declined — available balance is $0.00.');
    setBalances((b) => ({ ...b, checking: b.checking - amount }));
    setTransactions((items) => [{ id: crypto.randomUUID(), merchant: label, note: 'Demo payment', amount: -amount, date: 'Just now' }, ...items]);
    setModal(null);
    showToast('Payment completed in demo mode.');
  };

  return (
    <div className={`app ${theme}`}>
      <div className="phone-shell">
        <header className="topbar">
          <button className="icon-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={24} /></button>
          <button className="brand" onClick={() => setActive('home')} aria-label="AetherBank home">
            <span className="brand-mark">AE</span><span>AetherBank</span>
          </button>
          <button className="icon-button notification-button" onClick={() => setNotifications(!notifications)} aria-label="Notifications">
            {notifications ? <Bell size={23} /> : <BellOff size={23} />}
            {notifications && <i />}
          </button>
        </header>

        <main className="content">
          {active === 'home' && <HomeView balances={balances} total={total} hidden={hidden} recentSpend={recentSpend} setHidden={setHidden} openModal={setModal} transactions={transactions} />}
          {active === 'payments' && <PaymentsView transactions={transactions} openModal={setModal} />}
          {active === 'investments' && <InvestmentsView total={total} openModal={setModal} />}
          {active === 'support' && <SupportView showToast={showToast} />}
          {active === 'profile' && <ProfileView openModal={setModal} theme={theme} changeTheme={changeTheme} notifications={notifications} setNotifications={setNotifications} />}
        </main>

        <nav className="bottom-nav">
          {nav.map(({ id, label, icon: Icon }) => (
            <button key={id} className={active === id ? 'active' : ''} onClick={() => setActive(id)}>
              <Icon size={22} strokeWidth={active === id ? 2.5 : 1.9} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {menuOpen && <MenuDrawer close={() => setMenuOpen(false)} setActive={setActive} openSettings={() => { setMenuOpen(false); setModal('settings'); }} />}
        {modal && <Modal type={modal} close={() => setModal(null)} addMoney={addMoney} transfer={transfer} spend={spend} balances={balances} theme={theme} changeTheme={changeTheme} notifications={notifications} setNotifications={setNotifications} />}
        {toast && <div className="toast"><Check size={17} />{toast}</div>}
      </div>
    </div>
  );
}

function HomeView({ balances, total, hidden, recentSpend, setHidden, openModal, transactions }) {
  const display = (n) => hidden ? '••••••' : money(n);
  return <>
    <section className="hero-card">
      <div className="balance-row"><div><p>Personal Checking</p><small>Available: {display(balances.checking)}</small></div><strong>{display(balances.checking)}</strong></div>
      <div className="divider" />
      <div className="balance-row savings"><div><p>Savings</p><small>Available to save</small></div><strong>{display(balances.savings)}</strong></div>
      <div className="card-row">
        <div className="bank-card"><div className="mini-brand"><span>AE</span>AetherBank</div><div className="chip" /><div className="contactless">⌁</div><div className="card-name">Demo User</div><div className="last-four">Last 4: 0000</div><div className="card-dots"><i /><i /></div></div>
        <div className="spend"><span>Card spend</span><b>{money(recentSpend)}</b><div className="progress"><i style={{ width: recentSpend ? `${Math.min(100, recentSpend / 30)}%` : '0%' }} /></div><small>Available: {money(Math.max(0, 0 - recentSpend))}</small></div>
      </div>
      <div className="demo-note"><ShieldCheck size={14} /> Demo account · starts at $0.00</div>
    </section>

    <div className="balance-strip"><span>Total balance</span><strong>{hidden ? '••••••' : money(total)}</strong><button onClick={() => setHidden(!hidden)}>{hidden ? <Eye size={17} /> : <EyeOff size={17} />}</button></div>

    <section className="actions-section"><h2>Banking actions</h2><div className="action-grid">
      {quickActions.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => openModal(id)}><span><Icon size={23} /></span><b>{label}</b></button>)}
    </div></section>

    <section className="transactions"><div className="section-heading"><h2>Recent transactions</h2><button onClick={() => openModal('transactions')}><MoreHorizontal size={20} /></button></div>
      <div className="search"><Search size={18} /><span>Search transactions</span></div>
      {transactions.length === 0 ? <EmptyTransactions /> : transactions.slice(0, 6).map((t) => <Transaction key={t.id} item={t} />)}
    </section>
  </>;
}

function EmptyTransactions() {
  return <div className="empty"><div className="empty-icon"><Wallet size={22} /></div><div><b>No transactions yet</b><p>Your activity will appear here after you use the demo actions.</p></div></div>;
}

function Transaction({ item }) {
  const positive = item.amount > 0;
  return <div className="transaction"><div className={`merchant-icon ${positive ? 'positive' : ''}`}>{positive ? <Plus size={17} /> : <CreditCard size={17} />}</div><div className="transaction-copy"><b>{item.merchant}</b><span>{item.note} · {item.date}</span></div><strong className={positive ? 'positive-text' : item.amount === 0 ? '' : ''}>{item.amount === 0 ? 'Transfer' : `${positive ? '+' : '−'}${money(Math.abs(item.amount))}`}</strong></div>;
}

function PaymentsView({ transactions, openModal }) {
  return <Page title="Payments" subtitle="Move money and manage everyday payments.">
    <div className="feature-grid"><Feature icon={ArrowLeftRight} title="Transfer" text="Move money between your AetherBank accounts." onClick={() => openModal('transfer')} /><Feature icon={FileText} title="Pay a bill" text="Create a demo bill payment." onClick={() => openModal('pay')} /><Feature icon={QrCode} title="Scan to pay" text="Use a simulated QR payment flow." onClick={() => openModal('scan')} /><Feature icon={CreditCard} title="Cards" text="View your demo debit card." onClick={() => openModal('cards')} /></div>
    <div className="panel"><div className="section-heading"><h2>Payment activity</h2><span>{transactions.length} total</span></div>{transactions.length ? transactions.slice(0, 8).map((t) => <Transaction key={t.id} item={t} />) : <EmptyTransactions />}</div>
  </Page>;
}

function InvestmentsView({ total, openModal }) {
  return <Page title="Investments" subtitle="A calm starting point for future wealth tools.">
    <div className="investment-card"><div className="eyebrow">PORTFOLIO VALUE</div><strong>{money(0)}</strong><div className="investment-line"><TrendingUp size={18} /><span>0.00% today</span></div><p>Your investment balance is $0.00. Explore the demo controls without using real funds.</p></div>
    <div className="panel"><div className="section-heading"><h2>Watchlist</h2><button onClick={() => openModal('invest')}>Manage</button></div><div className="watch-row"><span>Demo Index</span><b>$0.00</b><small>0.00%</small></div><div className="watch-row"><span>Demo Bond</span><b>$0.00</b><small>0.00%</small></div></div>
    <div className="notice"><ShieldCheck size={18} /><div><b>Demo-only investing</b><p>No brokerage account or real trades are connected.</p></div></div>
  </Page>;
}

function SupportView({ showToast }) {
  return <Page title="Support" subtitle="Answers and help for your AetherBank demo.">
    <div className="support-hero"><div className="support-orb"><CircleHelp size={30} /></div><div><b>How can we help?</b><p>Browse common questions or start a demo support request.</p></div></div>
    {['How do I add money?', 'Why is my balance $0?', 'How does demo mode work?', 'Can I change the app theme?'].map((q) => <button className="list-item" key={q} onClick={() => showToast('Demo help article opened.')}>{q}<ChevronRight size={18} /></button>)}
    <button className="primary-button" onClick={() => showToast('Support request started in demo mode.')}>Contact support</button>
  </Page>;
}

function ProfileView({ openModal, theme, changeTheme, notifications, setNotifications }) {
  return <Page title="Profile" subtitle="Your demo identity and preferences.">
    <div className="profile-card"><div className="avatar">AE</div><div><b>Demo User</b><p>AetherBank demo account</p></div><ShieldCheck size={20} /></div>
    <div className="panel"><button className="settings-row" onClick={() => openModal('settings')}><span><Settings size={19} /> Settings</span><ChevronRight size={18} /></button><button className="settings-row" onClick={() => setNotifications(!notifications)}><span>{notifications ? <Bell size={19} /> : <BellOff size={19} />} Notifications</span><em>{notifications ? 'On' : 'Off'}</em></button><div className="theme-choice"><span>Theme</span><div><button className={theme === 'light' ? 'selected' : ''} onClick={() => changeTheme('light')}><Sun size={16} /> Light</button><button className={theme === 'dark' ? 'selected' : ''} onClick={() => changeTheme('dark')}><Moon size={16} /> Dark</button></div></div></div>
    <div className="security-box"><ShieldCheck size={20} /><div><b>Privacy first</b><p>This demo stores its sample state locally in your browser. No real bank credentials are requested.</p></div></div>
  </Page>;
}

function Page({ title, subtitle, children }) { return <section className="page"><div className="page-head"><div><h1>{title}</h1><p>{subtitle}</p></div></div>{children}</section>; }
function Feature({ icon: Icon, title, text, onClick }) { return <button className="feature" onClick={onClick}><span><Icon size={22} /></span><div><b>{title}</b><p>{text}</p></div><ChevronRight size={18} /></button>; }

function MenuDrawer({ close, setActive, openSettings }) {
  return <div className="drawer-backdrop" onClick={close}><aside className="drawer" onClick={(e) => e.stopPropagation()}><div className="drawer-head"><div className="brand"><span className="brand-mark">AE</span><span>AetherBank</span></div><button className="icon-button" onClick={close}><X size={22} /></button></div><p className="drawer-label">Navigation</p>{nav.map(({ id, label, icon: Icon }) => <button className="drawer-link" key={id} onClick={() => { setActive(id); close(); }}><Icon size={19} />{label}<ChevronRight size={16} /></button>)}<p className="drawer-label">Account</p><button className="drawer-link" onClick={openSettings}><Settings size={19} />Settings<ChevronRight size={16} /></button><div className="drawer-demo"><ShieldCheck size={17} /><span>Demo mode<br /><small>No real money connected</small></span></div></aside></div>;
}

function Modal({ type, close, addMoney, transfer, spend, balances, theme, changeTheme, notifications, setNotifications }) {
  const titles = { add: 'Add money', transfer: 'Transfer', withdraw: 'Withdraw', pay: 'Pay a bill', cards: 'Cards', scan: 'Scan to pay', transactions: 'Transactions', settings: 'Settings', invest: 'Watchlist' };
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('checking-to-savings');
  const [label, setLabel] = useState('Demo bill');
  const [saved, setSaved] = useState(false);
  const value = Number(amount);

  const submit = () => {
    if (type === 'add') return addMoney(value || 0);
    if (type === 'transfer') return transfer(value || 0, direction);
    if (type === 'withdraw') return spend(value || 0, 'ATM withdrawal');
    if (type === 'pay') return spend(value || 0, label || 'Demo bill');
    if (type === 'scan') return spend(value || 0, 'QR payment');
  };

  return <div className="modal-backdrop" onClick={close}><section className="modal" onClick={(e) => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">AETHERBANK</span><h2>{titles[type]}</h2></div><button className="icon-button" onClick={close}><X size={21} /></button></div>
    {type === 'settings' && <><div className="setting-block"><b>Appearance</b><p>Switch between the light and dark banking themes.</p><div className="theme-toggle"><button className={theme === 'light' ? 'selected' : ''} onClick={() => changeTheme('light')}><Sun size={17} /> Light</button><button className={theme === 'dark' ? 'selected' : ''} onClick={() => changeTheme('dark')}><Moon size={17} /> Dark</button></div></div><div className="setting-line" onClick={() => setNotifications(!notifications)}><span><Bell size={18} /><div><b>Notifications</b><small>Account alerts and activity updates</small></div></span><span className={`switch ${notifications ? 'on' : ''}`}><i /></span></div><div className="setting-line"><span><ShieldCheck size={18} /><div><b>Security</b><small>Demo security controls are enabled</small></div></span><Check size={18} /></div><button className="primary-button" onClick={() => close()}>Done</button></>}
    {type === 'cards' && <><div className="modal-card"><div className="mini-brand"><span>AE</span>AetherBank</div><div className="chip" /><div className="contactless">⌁</div><b>Demo User</b><small>•••• 0000</small></div><div className="info-row"><span>Card status</span><b className="positive-text">Active</b></div><div className="info-row"><span>Available to spend</span><b>{money(balances.checking)}</b></div><button className="primary-button" onClick={() => close()}>Done</button></>}
    {(type === 'add' || type === 'withdraw' || type === 'pay' || type === 'scan') && <><label className="field-label">Amount</label><div className="amount-field"><span>$</span><input autoFocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" /></div>{type === 'pay' && <><label className="field-label">Payee</label><input className="text-input" value={label} onChange={(e) => setLabel(e.target.value)} /></>}{type === 'scan' && <div className="qr-placeholder"><QrCode size={82} /><span>Camera simulation</span></div>}<div className="demo-warning"><ShieldCheck size={16} /> This is a demo. No real funds are moved.</div><button className="primary-button" onClick={submit}>{type === 'add' ? 'Add money' : type === 'withdraw' ? 'Withdraw' : 'Continue'}</button></>}
    {type === 'transfer' && <><div className="segmented"><button className={direction === 'checking-to-savings' ? 'selected' : ''} onClick={() => setDirection('checking-to-savings')}>To savings</button><button className={direction === 'savings-to-checking' ? 'selected' : ''} onClick={() => setDirection('savings-to-checking')}>To checking</button></div><label className="field-label">Amount</label><div className="amount-field"><span>$</span><input autoFocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" /></div><div className="transfer-balance"><span>Checking</span><b>{money(balances.checking)}</b><span>Savings</span><b>{money(balances.savings)}</b></div><button className="primary-button" onClick={submit}>Transfer</button></>}
    {type === 'transactions' && <div>{saved ? <div className="empty"><Check size={22} /><b>All caught up</b></div> : <><EmptyTransactions /><button className="primary-button" onClick={() => setSaved(true)}>Mark as reviewed</button></>}</div>}
    {type === 'invest' && <><div className="watch-row"><span>Demo Index</span><b>$0.00</b><small>0.00%</small></div><div className="watch-row"><span>Demo Bond</span><b>$0.00</b><small>0.00%</small></div><button className="primary-button" onClick={close}>Done</button></>}
  </section></div>;
}

createRoot(document.getElementById('root')).render(<App />);
