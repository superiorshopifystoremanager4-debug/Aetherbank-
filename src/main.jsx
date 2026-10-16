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
const DEMO_ROUTING_NUMBER = '021000021';
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
  const fallback = { member: freshMember(), members: [], transactions: [], theme: 'light', notifications: true, emailAddress: '', phoneNumber: '' };
  try {
    const raw = window.localStorage.getItem('aetherbank-state');
    if (!raw) return fallback;
    const saved = JSON.parse(raw);
    const base = saved && typeof saved === 'object' ? saved : {};
    const member = { ...fallback.member, ...(base.member || {}) };
    if (!member.accountNumber) member.accountNumber = accountNumber();
    const members = Array.isArray(base.members) ? base.members.map((m) => ({ ...member, ...m, accountNumber: m?.accountNumber || accountNumber() })) : [];
    const allMembers = members.some((m) => m.id === member.id) ? members : [member, ...members];
    return { member, members: allMembers, transactions: Array.isArray(base.transactions) ? base.transactions : [], theme: base.theme === 'dark' ? 'dark' : 'light', notifications: base.notifications !== false, emailAddress: typeof base.emailAddress === 'string' ? base.emailAddress : '', phoneNumber: typeof base.phoneNumber === 'string' ? base.phoneNumber : '' };
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
  const [emailAddress, setEmailAddress] = useState(initial.emailAddress || '');
  const [phoneNumber, setPhoneNumber] = useState(initial.phoneNumber || '');
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
  const save = (m = member, ms = members, tx = transactions, th = theme, notes = notifications, email = emailAddress, phone = phoneNumber) => safeSave({ member: m, members: ms, transactions: tx, theme: th, notifications: notes, emailAddress: email, phoneNumber: phone });
  const saveContactDetails = (email, phone) => { setEmailAddress(email); setPhoneNumber(phone); save(member, members, transactions, theme, notifications, email, phone); };
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
        {page === 'profile' && <Profile member={member} emailAddress={emailAddress} phoneNumber={phoneNumber} theme={theme} changeTheme={changeTheme} notifications={notifications} changeNotifications={changeNotifications} open={setModal} />}
      </main>

      <footer className="bottom-nav">{bottomNavigation.map(([key, label, Icon]) => <button key={key} className={(modal === 'cards' ? key === 'cards' : page === key) ? 'active' : ''} onClick={() => { if (key === 'cards') { setModal('cards'); return; } setModal(null); setPage(key); }}><Icon size={21} /><span>{label}</span></button>)}</footer>

      {drawer && <Drawer close={() => setDrawer(false)} page={page} setPage={setPage} settings={() => { setDrawer(false); setModal('settings'); }} />}
      {modal && <Modal type={modal} close={() => setModal(null)} open={setModal} member={member} members={members} addMoney={addMoney} transfer={transfer} debit={debit} register={register} theme={theme} changeTheme={changeTheme} notifications={notifications} changeNotifications={changeNotifications} transactions={transactions} flash={flash} physicalFrozen={physicalFrozen} setPhysicalFrozen={setPhysicalFrozen} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} emailAddress={emailAddress} setEmailAddress={setEmailAddress} phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber} saveContactDetails={saveContactDetails} />}
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
function Profile({ member, emailAddress, phoneNumber, theme, changeTheme, notifications, changeNotifications, open }) {
  return <Page title="Profile" subtitle="Your personal details, preferences and account access.">
    <div className="profile-card"><div className="avatar">{(member.name || 'AE').split(/\s+/).slice(0,2).map(part => part[0]).join('').toUpperCase()}</div><div className="profile-identity"><b>{member.name}</b><p>Checking account · ••••{member.accountNumber.slice(-5)}</p></div><ShieldCheck size={20} /></div>
    <section className="profile-section-card"><div className="profile-section-heading"><div><h2>Personal details</h2><p>Contact information and account identity</p></div><button onClick={() => open('settings')}>Edit <ChevronRight size={15}/></button></div>
      <div className="profile-detail-row"><span>Full name</span><b>{member.name}</b></div>
      <div className="profile-detail-row"><span>Email address</span>{emailAddress ? <b>{emailAddress}</b> : <button className="inline-action" onClick={() => open('settings')}>Add Email <ChevronRight size={14}/></button>}</div>
      <div className="profile-detail-row"><span>Phone number</span>{phoneNumber ? <b>{phoneNumber}</b> : <button className="inline-action" onClick={() => open('settings')}>Verify Phone Number <ChevronRight size={14}/></button>}</div>
    </section>
    <section className="profile-section-card"><div className="profile-section-heading"><div><h2>Preferences</h2><p>Choose how AetherBank appears to you</p></div></div>
      <button className="profile-setting-row" onClick={() => open('settings')}><span className="profile-setting-icon"><Settings size={18}/></span><span className="profile-setting-copy"><b>Account settings</b><small>Security, statements and preferences</small></span><ChevronRight size={18}/></button>
      <button className="profile-setting-row" onClick={() => changeNotifications(!notifications)}><span className="profile-setting-icon">{notifications ? <Bell size={18}/> : <BellOff size={18}/>}</span><span className="profile-setting-copy"><b>Notifications & alerts</b><small>Account and transaction activity</small></span><em>{notifications ? 'On' : 'Off'}</em></button>
      <div className="profile-theme-row"><span className="profile-setting-icon">{theme === 'light' ? <Sun size={18}/> : <Moon size={18}/>}</span><span className="profile-setting-copy"><b>Appearance</b><small>Light or dark theme</small></span><div className="theme-toggle"><button className={theme === 'light' ? 'selected' : ''} onClick={() => changeTheme('light')}><Sun size={15}/> Light</button><button className={theme === 'dark' ? 'selected' : ''} onClick={() => changeTheme('dark')}><Moon size={15}/> Dark</button></div></div>
    </section>
    <section className="profile-security-card"><span className="profile-security-icon"><ShieldCheck size={20}/></span><div><b>Account security</b><p>Review sign-in protection and two-factor authentication in Settings.</p></div><button aria-label="Open security settings" onClick={() => open('settings')}><ChevronRight size={18}/></button></section>
  </Page>;
}

function SettingsView({ member, emailAddress, setEmailAddress, phoneNumber, setPhoneNumber, saveContactDetails, notifications, changeNotifications, close, flash }) {
  const [emailEditing, setEmailEditing] = useState(false);
  const [phoneEditing, setPhoneEditing] = useState(false);
  const [twoFactorDetails, setTwoFactorDetails] = useState(false);
  const [paymentsDetails, setPaymentsDetails] = useState(false);

  return <div className="settings-view">
    <div className="settings-view-header">
      <div><h1>Settings</h1><p>Manage your preferences, account information, and security.</p></div>
      <button className="settings-close-button" aria-label="Close settings" onClick={close}><X size={20}/></button>
    </div>

    <section className="settings-view-card">
      <h3>Personal Information</h3>
      <div className="settings-view-rows">
        <div className="settings-view-row"><span>Full Name</span><b>{member.name}</b></div>
        <div className="settings-view-row"><span>Account Number</span><b>•••• {member.accountNumber.slice(-5)}</b></div>
        <div className="settings-view-row"><span>Routing Number</span><b>021000021</b></div>
        <div className="settings-view-row"><span>Email Address</span>{emailAddress ? <b className="settings-view-value">{emailAddress}</b> : <button className="settings-view-link" onClick={() => setEmailEditing(v => !v)}>+ Add Email</button>}</div>
        {emailEditing && <form className="settings-view-form" onSubmit={e => { e.preventDefault(); if (emailAddress.trim()) { saveContactDetails(emailAddress.trim(), phoneNumber); setEmailEditing(false); flash('Email address saved.'); } }}><label htmlFor="settings-email">Email Address</label><input id="settings-email" type="email" autoComplete="email" required value={emailAddress} onChange={e => setEmailAddress(e.target.value)} placeholder="you@example.com"/><div><button type="button" className="settings-view-cancel" onClick={() => setEmailEditing(false)}>Cancel</button><button type="submit" className="settings-view-submit">Save Email</button></div></form>}
        <div className="settings-view-row"><span>Phone Number</span>{phoneNumber ? <b className="settings-view-value">{phoneNumber}</b> : <button className="settings-view-link" onClick={() => setPhoneEditing(v => !v)}>+ Verify Phone</button>}</div>
        {phoneEditing && <form className="settings-view-form" onSubmit={e => { e.preventDefault(); if (phoneNumber.trim()) { saveContactDetails(emailAddress, phoneNumber.trim()); setPhoneEditing(false); flash('Phone number saved. Verification may still be required.'); } }}><label htmlFor="settings-phone">Phone Number</label><input id="settings-phone" type="tel" autoComplete="tel" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+1 (555) 000-0000"/><div><button type="button" className="settings-view-cancel" onClick={() => setPhoneEditing(false)}>Cancel</button><button type="submit" className="settings-view-submit">Save Phone</button></div></form>}
      </div>
    </section>

    <section className="settings-view-card">
      <h3>Security &amp; Controls</h3>
      <div className="settings-view-actions">
        <button className="settings-view-action" aria-expanded={twoFactorDetails} onClick={() => setTwoFactorDetails(v => !v)}><span><b>Security &amp; Sign-In</b><small>Password, biometrics, and multi-factor authentication</small></span><span className="settings-view-arrow">{twoFactorDetails ? '−' : '→'}</span></button>
        {twoFactorDetails && <div className="settings-view-detail"><b>Two-factor authentication</b><p>Review your sign-in protection. Enrollment changes must be completed through a verified banking sign-in process.</p></div>}
        <button className="settings-view-action" aria-expanded={paymentsDetails} onClick={() => setPaymentsDetails(v => !v)}><span><b>Payments &amp; Limits</b><small>Review daily transfer and ATM limits</small></span><span className="settings-view-arrow">{paymentsDetails ? '−' : '→'}</span></button>
        {paymentsDetails && <div className="settings-view-detail"><div><span>Daily transfer limit</span><b>$2,500.00</b></div><div><span>ATM withdrawal limit</span><b>$500.00</b></div></div>}
      </div>
    </section>

    <section className="settings-view-card">
      <h3>Notifications</h3>
      <div className="settings-view-actions">
        <button className="settings-view-action" role="switch" aria-checked={notifications} onClick={() => changeNotifications(!notifications)}><span><b>Account &amp; Transaction Alerts</b><small>Payment, transfer and account activity notifications</small></span><span className={`settings-view-switch ${notifications ? 'is-on' : ''}`} aria-hidden="true"><i/></span></button>
      </div>
    </section>

    <section className="settings-view-card">
      <h3>Statements &amp; Records</h3>
      <div className="settings-view-rows">
        <div className="settings-view-row"><span>Monthly Statements</span><small className="settings-view-unavailable">No statements available</small></div>
        <div className="settings-view-row"><span>Tax Documents</span><small className="settings-view-unavailable">Not available</small></div>
      </div>
    </section>
  </div>;
}

function Drawer({ close, setPage, settings }) { return <div className="drawer-backdrop" onClick={close}><aside className="drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><div className="brand"><span className="brand-mark">AE</span><strong>AetherBank</strong></div><button className="icon-button" aria-label="Close menu" onClick={close}><X size={22} /></button></div><p className="drawer-label">EXPLORE</p>{secondaryNavigation.map(([key, label, Icon]) => <button className="drawer-link" key={key} onClick={() => { setPage(key); close(); }}><Icon size={19} />{label}<ChevronRight size={16} /></button>)}<div className="drawer-demo"><ShieldCheck size={18}/><span><b>Account protected</b><small>Search, notifications and settings are available in the top bar.</small></span></div></aside></div>; }

function Modal({ type, close, open, member, members, addMoney, transfer, debit, register, theme, changeTheme, notifications, changeNotifications, transactions, flash, physicalFrozen, setPhysicalFrozen, globalSearch, setGlobalSearch, emailAddress, setEmailAddress, phoneNumber, setPhoneNumber, saveContactDetails }) {
  const [amount, setAmount] = useState(''); const [recipient, setRecipient] = useState(''); const [name, setName] = useState(''); const [payee, setPayee] = useState('Utility bill');
  const [bankSearch, setBankSearch] = useState(''); const [selectedBank, setSelectedBank] = useState(''); const [recipientName, setRecipientName] = useState(''); const [accountLast4, setAccountLast4] = useState(''); const [reviewTransfer, setReviewTransfer] = useState(false);
  const [cardTab, setCardTab] = useState('virtual');
  const [showVirtualDetails, setShowVirtualDetails] = useState(false);
  const copyValue = async (value, label) => { try { await navigator.clipboard.writeText(value); flash(`${label} copied.`); } catch { flash('Clipboard access is unavailable in this browser.'); } };
  const titles = { search: 'Search activity', add: 'Add Money', transfer: 'Transfer to a US bank', withdraw: 'Withdraw', pay: 'Pay Bills', cards: 'Card Management', 'virtual-card-details': 'Virtual Card Details', 'physical-card-details': 'Physical Card Details', 'account-details': 'Account Details', scan: 'Scan to Pay', register: 'Register Member', settings: 'Settings', transactions: 'Transactions', invest: 'Watchlist' };
  const submit = () => { if (type === 'add') addMoney(Number(amount)); else if (type === 'transfer') transfer(Number(amount), recipient); else if (type === 'withdraw') debit(Number(amount), 'ATM withdrawal'); else if (type === 'pay') debit(Number(amount), payee); else if (type === 'scan') debit(Number(amount), 'QR payment'); else if (type === 'register') register(name); };
  return <div className="modal-backdrop" onClick={close}><section className={`modal ${type === 'settings' ? 'settings-modal' : ''}`} onClick={e => e.stopPropagation()}>{type !== 'settings' && <div className="modal-head"><div><small>AETHERBANK</small><h2>{titles[type]}</h2></div><button className="icon-button" aria-label="Close dialog" onClick={close}><X size={21} /></button></div>
    {type === 'settings' && <SettingsView member={member} emailAddress={emailAddress} setEmailAddress={setEmailAddress} phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber} saveContactDetails={saveContactDetails} notifications={notifications} changeNotifications={changeNotifications} close={close} flash={flash} />}
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
