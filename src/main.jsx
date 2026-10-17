import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LockKeyhole, ArrowDownToLine, ArrowLeftRight, Bell, BellOff, Check, ChevronRight, CircleDollarSign, CircleHelp, Clock3, Copy, CreditCard, Eye, EyeOff, FileText, Home as HomeIcon, Landmark, Menu, Moon, MoreHorizontal, Plus, QrCode, RotateCcw, Search, Settings, ShieldCheck, ShoppingBag, Sun, TrendingUp, Truck, Utensils, User, Wallet, X, Zap } from 'lucide-react';
import './styles.css';

const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const accountNumber = () => String(Math.floor(1000000000 + Math.random() * 8999999999));
const CARD_NUMBER = '5312448899003711';
const PHYSICAL_CARD_NUMBER = '5399001122338842';
const CARD_EXPIRY = '08/29';
const CARD_CVV = '482';
const ROUTING_NUMBER = '021000021';
const SWIFT_CODE = 'AETHUS33XXX';
const id = () => Date.now() + '-' + Math.random().toString(36).slice(2);

const bottomNavigation = [['home', 'Home', HomeIcon], ['payments', 'Payments', Wallet], ['cards', 'Cards', CreditCard], ['profile', 'Profile', User]];
const secondaryNavigation = [['investments', 'Investments', TrendingUp], ['support', 'Support', CircleHelp]];
const quickActions = [['transfer', 'Transfer', ArrowLeftRight], ['withdraw', 'Withdraw', ArrowDownToLine], ['pay', 'Pay Bills', FileText], ['cards', 'Cards', CreditCard]];

const usBanks = ['JPMorgan Chase Bank', 'Bank of America', 'Wells Fargo Bank', 'Citibank', 'Capital One', 'U.S. Bank', 'PNC Bank', 'Truist Bank', 'TD Bank', 'Goldman Sachs Bank USA', 'Fifth Third Bank', 'Regions Bank', 'KeyBank', 'Citizens Bank', 'Ally Bank', 'Discover Bank', 'American Express National Bank', 'Huntington National Bank', 'BMO Bank', 'First Citizens Bank'];

const freshMember = () => ({ id: 'member-1', name: 'Jacob Joshua', accountNumber: accountNumber(), checking: 1000, savings: 250 });
const safeLoad = () => {
  const fallback = { member: freshMember(), members: [], transactions: [], theme: 'light', notifications: true, emailAddress: '', phoneNumber: '' };
  try {
    const raw = window.localStorage.getItem('aetherbank-state');
    if (!raw) return fallback;
    const saved = JSON.parse(raw);
    const base = saved && typeof saved === 'object' ? saved : {};
    const member = { ...fallback.member, ...(base.member || {}) };
    if (!member.accountNumber) member.accountNumber = accountNumber();
    if (member.checking === 0 && member.savings === 0) { member.checking = 1000; member.savings = 250; }
    const members = Array.isArray(base.members) ? base.members.map((m) => ({ ...member, ...m, accountNumber: m?.accountNumber || accountNumber() })) : [];
    const allMembers = members.some((m) => m.id === member.id) ? members : [member, ...members];
    return { member, members: allMembers, transactions: Array.isArray(base.transactions) ? base.transactions : [], theme: base.theme === 'dark' ? 'dark' : 'light', notifications: base.notifications !== false, emailAddress: typeof base.emailAddress === 'string' ? base.emailAddress : '', phoneNumber: typeof base.phoneNumber === 'string' ? base.phoneNumber : '' };
  } catch { return fallback; }
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
    const txs = [tx, ...transactions]; setMember(next); setTransactions(txs); save(next, members, txs); setModal(null); flash(money(amount) + ' added.');
  };
  const transfer = (amount, recipientNumber) => {
    const value = Number(amount);
    const recipient = members.find(m => m.accountNumber === recipientNumber && m.id !== member.id);
    if (!(value > 0)) return flash('Enter a valid transfer amount.');
    if (!recipient) return flash('Recipient account was not found.');
    if (value > member.checking) return flash('Transfer declined — available balance is ' + money(member.checking) + '.');
    const nextMember = { ...member, checking: member.checking - value };
    const nextRecipient = { ...recipient, checking: recipient.checking + value };
    const nextMembers = members.map(m => m.id === member.id ? nextMember : m.id === recipient.id ? nextRecipient : m);
    const txs = [{ id: id(), merchant: recipient.name, note: 'Transfer to ' + recipient.accountNumber, amount: -value, date: 'Just now' }, ...transactions];
    setMember(nextMember); setMembers(nextMembers); setTransactions(txs); save(nextMember, nextMembers, txs); setModal(null); flash('Transfer completed.');
  };
  const debit = (amount, merchant) => {
    const value = Number(amount);
    if (!(value > 0)) return flash('Enter a valid amount.');
    if (value > member.checking) return flash('Payment declined — available balance is ' + money(member.checking) + '.');
    const next = { ...member, checking: member.checking - value };
    const txs = [{ id: id(), merchant, note: 'Account payment', amount: -value, date: 'Just now' }, ...transactions];
    setMember(next); setTransactions(txs); save(next, members, txs); setModal(null); flash('Payment completed.');
  };
  const register = (name) => {
    if (!name.trim()) return flash('Enter the member name.');
    const newMember = { id: id(), name: name.trim(), accountNumber: accountNumber(), checking: 0, savings: 0 };
    const nextMembers = [...members, newMember]; setMembers(nextMembers); save(member, nextMembers, transactions); setModal(null); flash('Account created ending ' + newMember.accountNumber.slice(-4) + '.');
  };

  return (
    <div className={'app ' + theme}>
      <div className="phone-shell">
        <header className="topbar">
          <button className="icon-button" aria-label="Open secondary menu" onClick={() => setDrawer(true)}><Menu size={22} /></button>
          <button className="brand" onClick={() => { setPage('home'); setModal(null); }}><span className="brand-mark">AE</span><strong>AetherBank</strong></button>
          <div className="header-tools">
            <button className="icon-button" aria-label="Search transactions" onClick={() => { setGlobalSearch(''); setModal('search'); }}><Search size={20} /></button>
            <button className="icon-button notification-button" aria-label="Toggle notifications" onClick={() => changeNotifications(!notifications)}>{notifications ? <Bell size={20} /> : <BellOff size={20} />}{notifications && <i />}</button>
            <button className="icon-button" aria-label="Open settings" onClick={() => setModal('settings')}><Settings size={20} /></button>
          </div>
        </header>
        <main className="content">
          {page === 'home' && <Home member={member} show={show} total={total} hideBalance={hideBalance} setHideBalance={setHideBalance} cardSpend={cardSpend} transactions={transactions} open={setModal} />}
          {page === 'payments' && <Payments open={setModal} transactions={transactions} flash={flash} />}
          {page === 'investments' && <Investments open={setModal} />}
          {page === 'support' && <Support flash={flash} />}
          {page === 'profile' && <Profile member={member} emailAddress={emailAddress} phoneNumber={phoneNumber} theme={theme} changeTheme={changeTheme} notifications={notifications} changeNotifications={changeNotifications} open={setModal} />}
        </main>
        <footer className="bottom-nav">{bottomNavigation.map(([key, label, Icon]) => <button key={key} className={(modal === 'cards' ? key === 'cards' : page === key) ? 'active' : ''} onClick={() => { if (key === 'cards') { setModal('cards'); return; } setModal(null); setPage(key); }}><Icon size={21} /><span>{label}</span></button>)}</footer>
        {drawer && <Drawer close={() => setDrawer(false)} />}
        {modal && <Modal type={modal} close={() => setModal(null)} open={setModal} member={member} members={members} addMoney={addMoney} transfer={transfer} debit={debit} register={register} theme={theme} changeTheme={changeTheme} notifications={notifications} changeNotifications={changeNotifications} transactions={transactions} flash={flash} physicalFrozen={physicalFrozen} setPhysicalFrozen={setPhysicalFrozen} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} emailAddress={emailAddress} setEmailAddress={setEmailAddress} phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber} saveContactDetails={saveContactDetails} />}
        {message && <div className="toast"><Check size={17} />{message}</div>}
      </div>
    </div>
  );
}

function Home({ member, show, total, hideBalance, setHideBalance, cardSpend, transactions, open }) {
  return (
    <>
      <section className="hero-card">
        <div className="balance-heading"><div><span className="eyebrow">TOTAL RELATIONSHIP BALANCE</span><p>Personal accounts</p></div><button className="balance-visibility" aria-label={hideBalance ? 'Show balances' : 'Hide balances'} onClick={() => setHideBalance(!hideBalance)}>{hideBalance ? <Eye size={18}/> : <EyeOff size={18}/></button></div>
        <div className="balance-row"><div><p>Personal Checking</p><small>Available balance</small></div><strong>{show(member.checking)}</strong></div><div className="divider" />
        <div className="balance-row"><div><p>Savings</p><small>Available to save</small></div><strong>{show(member.savings)}</strong></div>
        <div className="account-line"><ShieldCheck size={14} /> Checking account <b>••••{member.accountNumber.slice(-5)}</b></div>
      </section>
      <button className="account-details-link" onClick={() => open('account-details')}><span><ShieldCheck size={17}/><span><b>Account Details</b><small>Routing, account and bank information</small></span></span><ChevronRight size={18}/></button>
      <section className="dashboard-card-section">
        <div className="section-heading"><div><h2>Cards & spending</h2><p>Keep track of your everyday spending</p></div><button onClick={() => open('cards')}>Manage <ChevronRight size={16}/></button></div>
        <button className="bank-card dashboard-bank-card card-full" onClick={() => open('cards')} aria-label="Manage debit card">
          <div className="mini-brand"><span>AE</span>AetherBank</div>
          <div className="chip" /><div className="contactless">⌁</div>
          <div className="card-name">{member.name}</div>
          <div className="last-four">•••• {CARD_NUMBER.slice(-4)}</div>
          <div className="card-dots"><i /><i /></div>
        </button>
        <div className="spend spend-below">
          <span>Recent card spend</span>
          <b>{show(cardSpend)}</b>
          <div className="progress"><i style={{ width: Math.min(100, cardSpend / 30) + '%' }} /></div>
          <small>Checking available: {show(member.checking)}</small>
        </div>
      </section>
      <section className="actions-section"><div className="section-heading"><h2>Banking Actions</h2><span className="section-caption">Quick access</span></div><div className="action-grid">{quickActions.map(([key, label, Icon]) => <button key={key} onClick={() => open(key)}><span><Icon size={22} /></span><b>{label}</b></button>)}</div></section>
      <section className="transactions"><div className="section-heading"><h2>Recent Transactions</h2><button onClick={() => open('transactions')}><MoreHorizontal size={20} /></button></div><div className="search"><Search size={18} /><span>Search transactions</span></div>{transactions.length ? transactions.slice(0, 8).map(t => <Transaction key={t.id} item={t} />) : <div className="empty"><div className="empty-icon"><Wallet size={22} /></div><div><b>No transactions yet</b><p>Your transaction history will appear here.</p></div></div>}</section>
    </>
  );
}

function Transaction({ item }) {
  const positive = item.amount > 0;
  const label = ((item.merchant || '') + ' ' + (item.note || '')).toLowerCase();
  const Icon = /transfer|account funding|deposit|payroll|salary/.test(label) ? Landmark : /grocery|market|shop|store|retail/.test(label) ? ShoppingBag : /cafe|coffee|restaurant|food|dining/.test(label) ? Utensils : /electric|utility|bill|power/.test(label) ? Zap : /atm|withdraw|cash/.test(label) ? CircleDollarSign : CreditCard;
  const status = item.status === 'pending' ? 'Pending' : 'Completed';
  return <div className="transaction"><div className={'merchant-icon ' + (positive ? 'positive' : '')}><Icon size={18}/></div><div className="transaction-copy"><div className="transaction-title-row"><b>{item.merchant || 'Account activity'}</b><span className={'transaction-status ' + status.toLowerCase()}>{status}</span></div><span className="transaction-meta">{item.note || (positive ? 'Incoming credit' : 'Card payment')} · {item.date || 'Date unavailable'}</span></div><strong className={'transaction-amount ' + (positive ? 'positive-text' : '')}>{positive ? '+' : '−'}{money(Math.abs(item.amount))}</strong></div>;
}
function Page({ title, subtitle, children }) { return <section className="page"><h1>{title}</h1><p className="page-subtitle">{subtitle}</p>{children}</section>; }
function Payments({ open, transactions }) { return <Page title="Payments" subtitle="Transfer money, pay bills and manage cards."><div className="feature-grid"><Feature icon={ArrowLeftRight} title="Transfer" text="Send money to another AetherBank member." click={() => open('transfer')} /><Feature icon={FileText} title="Pay Bills" text="Make a payment from your checking account." click={() => open('pay')} /><Feature icon={QrCode} title="Scan to Pay" text="Pay securely with a QR code." click={() => open('scan')} /><Feature icon={CreditCard} title="Cards" text="View your active AetherBank card." click={() => open('cards')} /></div><div className="panel"><h2>Payment Activity</h2>{transactions.length ? transactions.slice(0, 6).map(t => <Transaction key={t.id} item={t} />) : <div className="empty"><b>No payment activity yet.</b></div>}</div></Page>; }
function Feature({ icon: Icon, title, text, click }) { return <button className="feature" onClick={click}><span><Icon size={22} /></span><div><b>{title}</b><p>{text}</p></div><ChevronRight size={18} /></button>; }
function Investments({ open }) { return <Page title="Investments" subtitle="Track your portfolio and future wealth."><div className="investment-card"><small>PORTFOLIO VALUE</small><strong>$0.00</strong><div><TrendingUp size={18} /> 0.00% today</div></div><div className="panel"><div className="section-heading"><h2>Watchlist</h2><button onClick={() => open('invest')}>Manage</button></div><div className="watch-row"><span>Aether Index</span><b>$0.00</b><small>0.00%</small></div><div className="watch-row"><span>Aether Bond</span><b>$0.00</b><small>0.00%</small></div></div></Page>; }
function Support({ flash }) {
  const [expanded, setExpanded] = useState(0);
  const faqs = [
    ['How do internal and wire transfers work?', 'Internal transfers between accounts at the same institution are often processed quickly. Wire transfers move through banking networks and may have fees, cut-off times, and additional verification.'],
    ['What are my daily transaction and ATM limits?', 'Daily purchase, transfer, and ATM limits vary by account, card, and institution. Check your official account agreement or contact support for your actual limits.'],
    ['How do I lock or report a lost card?', 'Use Freeze card in Cards to block new purchases, then contact support to report it and request a replacement.'],
    ['When do direct deposits post to my checking account?', 'Posting time depends on when the sender submits the payment and the receiving bank processing schedule.']
  ];
  return <Page title="Support" subtitle="Guidance for everyday banking and account security."><div className="support-hero"><div className="support-orb"><CircleHelp size={26} /></div><div><b>How can we help?</b><p>Browse common banking questions or reach the support team.</p></div></div><div className="faq-list">{faqs.map(([q,a],i) => <section className={'faq-item ' + (expanded === i ? 'expanded' : '')} key={q}><button className="faq-question" aria-expanded={expanded === i} onClick={() => setExpanded(expanded === i ? -1 : i)}><span>{q}</span><ChevronRight size={18}/></button>{expanded === i && <p className="faq-answer">{a}</p>}</section>)}</div><button className="primary-button" onClick={() => flash('Support request submitted.')}>Contact support</button></Page>;
}
function Profile({ member, emailAddress, phoneNumber, theme, changeTheme, notifications, changeNotifications, open }) {
  return <Page title="Profile" subtitle="Personal details and preferences."><div className="panel"><div className="balance-row"><div><p>Name</p></div><strong>{member.name}</strong></div><div className="balance-row"><div><p>Account</p></div><strong>••••{member.accountNumber.slice(-4)}</strong></div><div className="balance-row"><div><p>Email</p></div><strong>{emailAddress || 'Not set'}</strong></div><div className="balance-row"><div><p>Phone</p></div><strong>{phoneNumber || 'Not set'}</strong></div></div><div className="panel" style={{ marginTop: 12 }}><h2>Preferences</h2><button className="feature" onClick={() => changeTheme(theme === 'dark' ? 'light' : 'dark')}><span>{theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}</span><div><b>Theme</b><p>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p></div><ChevronRight size={18} /></button><button className="feature" onClick={() => changeNotifications(!notifications)}><span>{notifications ? <Bell size={22} /> : <BellOff size={22} />}</span><div><b>Notifications</b><p>{notifications ? 'On' : 'Off'}</p></div><ChevronRight size={18} /></button></div></Page>;
}
function Drawer({ close }) {
  return (
    <div className="drawer-backdrop" onClick={close}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head"><strong>AetherBank</strong><button onClick={close} aria-label="Close menu"><X size={20} /></button></div>
        <p className="drawer-label">Account</p>
        <button type="button" onClick={close}>Account Statements & Tax Documents</button>
        <button type="button" onClick={close}>Linked External Accounts & Wire Settings</button>
        <button type="button" onClick={close}>Security & 2FA</button>
        <div className="drawer-divider" />
        <button type="button" className="drawer-logout" onClick={() => { close(); }}>Log Out</button>
      </div>
    </div>
  );
}
function Modal({ type, close, open, member, members, addMoney, transfer, debit, register, theme, changeTheme, notifications, changeNotifications, transactions, flash, physicalFrozen, setPhysicalFrozen, globalSearch, setGlobalSearch, emailAddress, setEmailAddress, phoneNumber, setPhoneNumber, saveContactDetails }) {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [payee, setPayee] = useState('');
  const [name, setName] = useState('');
  const [bankQuery, setBankQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const otherMembers = members.filter(m => m.id !== member.id);
  const filteredBanks = usBanks.filter(b => b.toLowerCase().includes(bankQuery.toLowerCase()));
  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><strong>{type === 'transfer' ? 'Transfer' : type === 'withdraw' ? 'Withdraw' : type === 'pay' ? 'Pay Bills' : type === 'cards' ? 'Cards' : type === 'account-details' ? 'Account Details' : type === 'transactions' ? 'Transactions' : type === 'settings' ? 'Settings' : type === 'search' ? 'Search' : type === 'scan' ? 'Scan to Pay' : type === 'add-money' ? 'Add Money' : 'AetherBank'}</strong><button onClick={close}><X size={20} /></button></div>
        <div className="modal-body">
          {type === 'transfer' && (<><p className="modal-note">Available: {money(member.checking)}</p><label>Amount<input type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} /></label><p className="modal-section">Select a U.S. bank or member</p><input type="search" placeholder="Search banks..." value={bankQuery} onChange={(e) => setBankQuery(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 10, borderRadius: 8, border: '1px solid #ccc' }} />{filteredBanks.slice(0, 8).map(b => <button key={b} className={'recipient-option ' + (selectedBank === b ? 'selected' : '')} onClick={() => setSelectedBank(b)}><b>{b}</b></button>)}{otherMembers.map(m => <button key={m.id} className={'recipient-option ' + (recipient === m.accountNumber ? 'selected' : '')} onClick={() => setRecipient(m.accountNumber)}><b>{m.name}</b><small>••••{m.accountNumber.slice(-4)}</small></button>)}<button className="primary-button" onClick={() => transfer(amount, recipient)}>Send transfer</button></>)}
          {type === 'withdraw' && (<><p className="modal-note">Available: {money(member.checking)}</p><label>Amount<input type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} /></label><button className="primary-button" onClick={() => debit(amount, 'Withdrawal')}>Confirm withdrawal</button></>)}
          {type === 'pay' && (<><p className="modal-note">Available: {money(member.checking)}</p><label>Amount<input type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} /></label><label>Payee<input type="text" placeholder="Merchant or bill name" value={payee} onChange={(e) => setPayee(e.target.value)} /></label><button className="primary-button" onClick={() => debit(amount, payee || 'Bill payment')}>Pay now</button></>)}
          {type === 'cards' && <CardsModal member={member} physicalFrozen={physicalFrozen} setPhysicalFrozen={setPhysicalFrozen} flash={flash} close={close} />}
          {type === 'account-details' && (<><div className="detail-row"><span>Account holder</span><b>{member.name}</b></div><div className="detail-row"><span>Account number</span><b>{member.accountNumber}</b></div><div className="detail-row"><span>Routing number</span><b>{ROUTING_NUMBER}</b></div><div className="detail-row"><span>SWIFT</span><b>{SWIFT_CODE}</b></div><div className="detail-row"><span>Account type</span><b>Checking</b></div><div className="detail-row"><span>Status</span><b>Active · Member FDIC</b></div><button className="primary-button" onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(member.accountNumber); flash('Account number copied.'); }}>Copy account number</button></>)}
          {type === 'transactions' && (<>{transactions.length ? transactions.map(t => <Transaction key={t.id} item={t} />) : <div className="empty"><b>No transactions yet</b></div>}</>)}
          {type === 'settings' && (<><button className="feature" onClick={() => changeTheme(theme === 'dark' ? 'light' : 'dark')}><span>{theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}</span><div><b>Theme</b><p>{theme === 'dark' ? 'Switch to light' : 'Switch to dark'}</p></div></button><button className="feature" onClick={() => changeNotifications(!notifications)}><span>{notifications ? <Bell size={22} /> : <BellOff size={22} />}</span><div><b>Notifications</b><p>{notifications ? 'Turn off' : 'Turn on'}</p></div></button></>)}
          {type === 'search' && (<><input type="search" placeholder="Search transactions..." value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} autoFocus style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid #ccc' }} />{transactions.filter(t => !globalSearch || ((t.merchant || '') + ' ' + (t.note || '')).toLowerCase().includes(globalSearch.toLowerCase())).map(t => <Transaction key={t.id} item={t} />)}</>)}
          {type === 'scan' && <ScanToPay flash={flash} close={close} />}
          {type === 'add-money' && (<><label>Amount<input type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} /></label><button className="primary-button" onClick={() => addMoney(Number(amount))}>Add to Checking</button></>)}
        </div>
      </div>
    </div>
  );
}

function CardsModal({ member, physicalFrozen, setPhysicalFrozen, flash, close }) {
  const [tab, setTab] = useState('virtual');
  const [showDetails, setShowDetails] = useState(false);
  return (
    <>
      <div className="card-tabs">
        <button type="button" className={tab === 'virtual' ? 'selected' : ''} onClick={() => setTab('virtual')}>Virtual Card</button>
        <button type="button" className={tab === 'physical' ? 'selected' : ''} onClick={() => setTab('physical')}>Physical Card</button>
      </div>
      {tab === 'virtual' && (
        <>
          <div className="bank-card modal-card card-virtual">
            <div className="mini-brand"><span>AE</span>AetherBank</div>
            <div className="chip" />
            <div className="card-name">{member.name}</div>
            <div className="last-four">•••• 3711</div>
          </div>
          <div className="detail-row"><span>Card number</span><b>{showDetails ? '5312 4488 9900 3711' : '•••• •••• •••• 3711'}</b></div>
          <div className="detail-row"><span>Expiry</span><b>{showDetails ? CARD_EXPIRY : '••/••'}</b></div>
          <div className="detail-row"><span>CVV</span><b>{showDetails ? CARD_CVV : '•••'}</b></div>
          <button type="button" className="primary-button" onClick={() => setShowDetails(!showDetails)}>{showDetails ? 'Hide card details' : 'Show card details'}</button>
        </>
      )}
      {tab === 'physical' && (
        <>
          <div className="bank-card modal-card card-physical">
            <div className="mini-brand"><span>AE</span>AetherBank</div>
            <div className="chip" />
            <div className="card-name">{member.name}</div>
            <div className="last-four">•••• 8842</div>
          </div>
          <div className="detail-row"><span>Delivery status</span><b>Shipped</b></div>
          <div className="detail-row"><span>Status</span><b>{physicalFrozen ? 'Frozen' : 'Active'}</b></div>
          <button type="button" className="primary-button" onClick={() => { setPhysicalFrozen(!physicalFrozen); flash(physicalFrozen ? 'Physical card unfrozen.' : 'Physical card frozen.'); }}>
            {physicalFrozen ? 'Unfreeze physical card' : 'Freeze physical card'}
          </button>
          <button type="button" className="secondary-button" onClick={() => flash('PIN reset instructions sent.')}>Reset PIN</button>
        </>
      )}
    </>
  );
}

function ScanToPay({ flash, close }) {
  const [torch, setTorch] = useState(false);
  return (
    <div className="scan-pay">
      <div className={'scan-viewfinder ' + (torch ? 'torch-on' : '')}>
        <span className="scan-corner tl" /><span className="scan-corner tr" />
        <span className="scan-corner bl" /><span className="scan-corner br" />
        <p>Align QR code inside the frame</p>
      </div>
      <button type="button" className="secondary-button" onClick={() => setTorch(!torch)}>{torch ? 'Turn off flashlight' : 'Torch / Flashlight'}</button>
      <button type="button" className="primary-button" onClick={() => flash('QR image selected. Processing payment…')}>Upload QR Code Image from Gallery</button>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
