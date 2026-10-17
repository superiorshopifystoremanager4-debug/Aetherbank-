import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDownToLine, ArrowLeftRight, Bell, BellOff, Check, ChevronRight,
  CircleDollarSign, CircleHelp, CreditCard, Eye, EyeOff, FileText,
  Home as HomeIcon, Landmark, Menu, Moon, MoreHorizontal, QrCode, Search,
  Settings, ShieldCheck, ShoppingBag, Sun, TrendingUp, Utensils, User, Wallet, X, Zap
} from 'lucide-react';
import './styles.css';

const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const accountNumber = () => String(Math.floor(1000000000 + Math.random() * 8999999999));
const CARD_NUMBER = '5312448899003711';
const ROUTING_NUMBER = '021000021';
const id = () => Date.now() + '-' + Math.random().toString(36).slice(2);

const US_BANKS = [
  { name: 'JPMorgan Chase Bank', routing: '021000021' },
  { name: 'Bank of America', routing: '026009593' },
  { name: 'Wells Fargo Bank', routing: '121000248' },
  { name: 'Citibank', routing: '021000089' },
  { name: 'Capital One', routing: '031176110' },
  { name: 'U.S. Bank', routing: '091000022' },
  { name: 'PNC Bank', routing: '043000096' },
  { name: 'Truist Bank', routing: '061000104' },
  { name: 'TD Bank', routing: '031101266' },
  { name: 'Ally Bank', routing: '124003116' },
  { name: 'Fifth Third Bank', routing: '042000314' },
  { name: 'Regions Bank', routing: '062000019' },
  { name: 'KeyBank', routing: '041001039' },
  { name: 'Citizens Bank', routing: '011401533' },
  { name: 'Huntington National Bank', routing: '044000024' },
  { name: 'BMO Bank', routing: '071000288' },
  { name: 'Discover Bank', routing: '031100649' },
  { name: 'First Citizens Bank', routing: '053100300' },
];

const bottomNavigation = [['home', 'Home', HomeIcon], ['payments', 'Payments', Wallet], ['cards', 'Cards', CreditCard], ['profile', 'Profile', User]];
const quickActions = [['transfer', 'Transfer', ArrowLeftRight], ['withdraw', 'Withdraw', ArrowDownToLine], ['pay', 'Pay Bills', FileText], ['cards', 'Cards', CreditCard]];

const freshMember = () => ({ id: 'member-1', name: 'Jacob Joshua', accountNumber: accountNumber(), checking: 1000, savings: 250 });
const secondMember = () => ({ id: 'member-2', name: 'Alex Rivera', accountNumber: accountNumber(), checking: 500, savings: 100 });

const safeLoad = () => {
  const fallback = { member: freshMember(), members: [freshMember(), secondMember()], transactions: [], theme: 'light', notifications: true, emailAddress: '', phoneNumber: '' };
  try {
    const raw = window.localStorage.getItem('aetherbank-state');
    if (!raw) return fallback;
    const saved = JSON.parse(raw);
    const base = saved && typeof saved === 'object' ? saved : {};
    const member = { ...fallback.member, ...(base.member || {}) };
    if (!member.accountNumber) member.accountNumber = accountNumber();
    if (member.checking === 0 && member.savings === 0) { member.checking = 1000; member.savings = 250; }
    let members = Array.isArray(base.members) ? base.members : [];
    if (members.length < 2) members = [member, secondMember()];
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
  const cardSpend = useMemo(() => transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0), [transactions]);
  const show = (value) => (hideBalance ? '••••••' : money(value));
  const save = (m, ms, tx, th, notes) => safeSave({ member: m || member, members: ms || members, transactions: tx || transactions, theme: th !== undefined ? th : theme, notifications: notes !== undefined ? notes : notifications, emailAddress, phoneNumber });
  const flash = (text) => { setMessage(text); window.setTimeout(() => setMessage(''), 2800); };
  const changeTheme = (value) => { setTheme(value); save(member, members, transactions, value, notifications); };
  const changeNotifications = (value) => { setNotifications(value); save(member, members, transactions, theme, value); };

  const transferToMember = (amount, recipientNumber) => {
    const value = Number(amount);
    const recipient = members.find((m) => m.accountNumber === recipientNumber && m.id !== member.id);
    if (!(value > 0)) return flash('Enter a valid transfer amount.');
    if (!recipient) return flash('Recipient account was not found.');
    if (value > member.checking) return flash('Transfer declined — available balance is ' + money(member.checking) + '.');
    const nextMember = { ...member, checking: member.checking - value };
    const nextRecipient = { ...recipient, checking: recipient.checking + value };
    const nextMembers = members.map((m) => (m.id === member.id ? nextMember : m.id === recipient.id ? nextRecipient : m));
    const txs = [{ id: id(), merchant: recipient.name, note: 'Transfer to ••••' + recipient.accountNumber.slice(-4), amount: -value, date: 'Just now', status: 'Completed' }, ...transactions];
    setMember(nextMember); setMembers(nextMembers); setTransactions(txs); save(nextMember, nextMembers, txs); setModal(null);
    flash('Transfer of ' + money(value) + ' completed.');
  };
  const transferToSavings = (amount) => {
    const value = Number(amount);
    if (!(value > 0)) return flash('Enter a valid amount.');
    if (value > member.checking) return flash('Insufficient funds. Available: ' + money(member.checking) + '.');
    const next = { ...member, checking: member.checking - value, savings: member.savings + value };
    const txs = [{ id: id(), merchant: 'Internal transfer', note: 'Checking → Savings', amount: -value, date: 'Just now', status: 'Completed' }, ...transactions];
    setMember(next); setTransactions(txs); save(next, members, txs); setModal(null);
    flash(money(value) + ' moved to Savings.');
  };
  const transferExternal = (amount, bankName, routing, acct, holderName) => {
    const value = Number(amount);
    if (!(value > 0)) return flash('Enter a valid amount.');
    if (value > member.checking) return flash('Insufficient funds. Available: ' + money(member.checking) + '.');
    if (!routing || !acct) return flash('Enter routing and account number.');
    const next = { ...member, checking: member.checking - value };
    const txs = [{ id: id(), merchant: bankName || 'External bank', note: 'ACH to ' + (holderName || 'account') + ' ••••' + String(acct).slice(-4), amount: -value, date: 'Just now', status: 'Processing' }, ...transactions];
    setMember(next); setTransactions(txs); save(next, members, txs); setModal(null);
    flash('ACH transfer of ' + money(value) + ' submitted. Usually 1–3 business days.');
  };
  const transferZelle = (amount, contact, name) => {
    const value = Number(amount);
    if (!(value > 0)) return flash('Enter a valid amount.');
    if (value > member.checking) return flash('Insufficient funds. Available: ' + money(member.checking) + '.');
    if (!contact) return flash('Enter email or U.S. mobile number.');
    const next = { ...member, checking: member.checking - value };
    const txs = [{ id: id(), merchant: name || contact, note: 'Zelle to ' + contact, amount: -value, date: 'Just now', status: 'Completed' }, ...transactions];
    setMember(next); setTransactions(txs); save(next, members, txs); setModal(null);
    flash('Zelle transfer of ' + money(value) + ' sent.');
  };
  const withdraw = (amount) => {
    const value = Number(amount);
    if (!(value > 0)) return flash('Enter a valid amount.');
    if (value > member.checking) return flash('Insufficient funds. Available: ' + money(member.checking) + '.');
    const next = { ...member, checking: member.checking - value };
    const txs = [{ id: id(), merchant: 'Withdrawal', note: 'Cash / external withdrawal', amount: -value, date: 'Just now', status: 'Completed' }, ...transactions];
    setMember(next); setTransactions(txs); save(next, members, txs); setModal(null);
    flash('Withdrawal of ' + money(value) + ' completed.');
  };
  const debit = (amount, merchant) => {
    const value = Number(amount);
    if (!(value > 0)) return flash('Enter a valid amount.');
    if (value > member.checking) return flash('Payment declined — available balance is ' + money(member.checking) + '.');
    const next = { ...member, checking: member.checking - value };
    const txs = [{ id: id(), merchant, note: 'Account payment', amount: -value, date: 'Just now', status: 'Completed' }, ...transactions];
    setMember(next); setTransactions(txs); save(next, members, txs); setModal(null);
    flash('Payment completed.');
  };

  return (
    <div className={'app ' + theme}>
      <div className="phone-shell">
        <header className="topbar">
          <button className="icon-button" aria-label="Open menu" onClick={() => setDrawer(true)}><Menu size={22} /></button>
          <button className="brand" onClick={() => { setPage('home'); setModal(null); }}><span className="brand-mark">AE</span><strong>AetherBank</strong></button>
          <div className="header-tools">
            <button className="icon-button" aria-label="Search" onClick={() => { setGlobalSearch(''); setModal('search'); }}><Search size={20} /></button>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => changeNotifications(!notifications)}>{notifications ? <Bell size={20} /> : <BellOff size={20} />}{notifications && <i />}</button>
            <button className="icon-button" aria-label="Settings" onClick={() => setModal('settings')}><Settings size={20} /></button>
          </div>
        </header>
        <main className="content">
          {page === 'home' && <Home member={member} show={show} hideBalance={hideBalance} setHideBalance={setHideBalance} cardSpend={cardSpend} transactions={transactions} open={setModal} />}
          {page === 'payments' && <Payments open={setModal} transactions={transactions} />}
          {page === 'investments' && <Investments />}
          {page === 'support' && <Support flash={flash} />}
          {page === 'profile' && <Profile member={member} emailAddress={emailAddress} phoneNumber={phoneNumber} theme={theme} changeTheme={changeTheme} notifications={notifications} changeNotifications={changeNotifications} />}
        </main>
        <footer className="bottom-nav">
          {bottomNavigation.map(([key, label, Icon]) => (
            <button key={key} className={modal === 'cards' ? (key === 'cards' ? 'active' : '') : page === key ? 'active' : ''} onClick={() => { if (key === 'cards') { setModal('cards'); return; } setModal(null); setPage(key); }}>
              <Icon size={21} /><span>{label}</span>
            </button>
          ))}
        </footer>
        {drawer && <Drawer close={() => setDrawer(false)} page={page} setPage={setPage} settings={() => { setDrawer(false); setModal('settings'); }} />}
        {modal && <Modal type={modal} close={() => setModal(null)} member={member} members={members} transferToMember={transferToMember} transferToSavings={transferToSavings} transferExternal={transferExternal} transferZelle={transferZelle} withdraw={withdraw} debit={debit} theme={theme} changeTheme={changeTheme} notifications={notifications} changeNotifications={changeNotifications} transactions={transactions} flash={flash} physicalFrozen={physicalFrozen} setPhysicalFrozen={setPhysicalFrozen} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} />}
        {message && <div className="toast"><Check size={17} />{message}</div>}
      </div>
    </div>
  );
}

function Home({ member, show, hideBalance, setHideBalance, cardSpend, transactions, open }) {
  return (
    <>
      <section className="hero-card">
        <div className="balance-heading"><div><span className="eyebrow">TOTAL RELATIONSHIP BALANCE</span><p>Personal accounts · Member FDIC</p></div>
          <button className="balance-visibility" aria-label={hideBalance ? 'Show balances' : 'Hide balances'} onClick={() => setHideBalance(!hideBalance)}>{hideBalance ? <Eye size={18} /> : <EyeOff size={18} />}</button></div>
        <div className="balance-row"><div><p>Personal Checking</p><small>Available balance</small></div><strong>{show(member.checking)}</strong></div>
        <div className="divider" />
        <div className="balance-row"><div><p>Savings</p><small>Available to save</small></div><strong>{show(member.savings)}</strong></div>
        <div className="account-line"><ShieldCheck size={14} /> Checking · ••••{member.accountNumber.slice(-4)}</div>
      </section>
      <button className="account-details-link" onClick={() => open('account-details')}><span><ShieldCheck size={17} /><span><b>Account Details</b><small>Routing, account and bank information</small></span></span><ChevronRight size={18} /></button>
      <section className="dashboard-card-section">
        <div className="section-heading"><div><h2>Cards & spending</h2><p>Keep track of your everyday spending</p></div><button onClick={() => open('cards')}>Manage <ChevronRight size={16} /></button></div>
        <div className="card-row">
          <button className="bank-card dashboard-bank-card" onClick={() => open('cards')} aria-label="Manage debit card">
            <div className="mini-brand"><span>AE</span>AetherBank</div><div className="chip" /><div className="contactless">⌁</div>
            <div className="card-name">{member.name}</div><div className="last-four">•••• {CARD_NUMBER.slice(-4)}</div>
          </button>
          <div className="spend"><span>Recent card spend</span><b>{show(cardSpend)}</b><div className="progress"><i style={{ width: Math.min(100, cardSpend / 30) + '%' }} /></div><small>Checking available: {show(member.checking)}</small></div>
        </div>
        <p className="card-note">AetherBank Debit Card</p>
      </section>
      <section className="actions-section">
        <div className="section-heading"><h2>Banking Actions</h2><span className="section-caption">Quick access</span></div>
        <div className="action-grid">{quickActions.map(([key, label, Icon]) => <button key={key} onClick={() => open(key)}><span><Icon size={22} /></span><b>{label}</b></button>)}</div>
      </section>
      <section className="transactions">
        <div className="section-heading"><h2>Recent Transactions</h2><button onClick={() => open('transactions')}><MoreHorizontal size={20} /></button></div>
        <div className="search"><Search size={18} /><span>Search transactions</span></div>
        {transactions.length ? transactions.slice(0, 8).map((t) => <Transaction key={t.id} item={t} />) : (
          <div className="empty"><div className="empty-icon"><Wallet size={22} /></div><div><b>No transactions yet</b><p>Your transaction history will appear here.</p></div></div>
        )}
      </section>
    </>
  );
}

function Transaction({ item }) {
  const positive = item.amount > 0;
  const label = ((item.merchant || '') + ' ' + (item.note || '')).toLowerCase();
  const Icon = /transfer|account funding|deposit|ach|zelle/.test(label) ? Landmark : /grocery|market|shop|store|retail/.test(label) ? ShoppingBag : /cafe|coffee|restaurant|food|dining/.test(label) ? Utensils : /electric|utility|bill|power/.test(label) ? Zap : /atm|withdraw|cash/.test(label) ? CircleDollarSign : CreditCard;
  const status = item.status === 'Processing' || item.status === 'pending' ? 'Processing' : 'Completed';
  return (
    <div className="transaction">
      <div className={'merchant-icon ' + (positive ? 'positive' : '')}><Icon size={18} /></div>
      <div className="transaction-copy">
        <div className="transaction-title-row"><b>{item.merchant || 'Account activity'}</b><span className={'transaction-status ' + status.toLowerCase()}>{status}</span></div>
        <span className="transaction-meta">{item.note || (positive ? 'Incoming credit' : 'Card payment')} · {item.date || 'Date unavailable'}</span>
      </div>
      <strong className={'transaction-amount ' + (positive ? 'positive-text' : '')}>{positive ? '+' : '−'}{money(Math.abs(item.amount))}</strong>
    </div>
  );
}

function Page({ title, subtitle, children }) {
  return <section className="page"><h1>{title}</h1><p className="page-subtitle">{subtitle}</p>{children}</section>;
}
function Payments({ open, transactions }) {
  return (
    <Page title="Payments" subtitle="Transfer money, pay bills and manage cards.">
      <div className="feature-grid">
        <Feature icon={ArrowLeftRight} title="Transfer" text="Between accounts, Zelle, or another U.S. bank." click={() => open('transfer')} />
        <Feature icon={FileText} title="Pay Bills" text="Make a payment from your checking account." click={() => open('pay')} />
        <Feature icon={QrCode} title="Scan to Pay" text="Pay securely with a QR code." click={() => open('scan')} />
        <Feature icon={CreditCard} title="Cards" text="View your AetherBank card." click={() => open('cards')} />
      </div>
      <div className="panel"><h2>Payment Activity</h2>
        {transactions.length ? transactions.slice(0, 6).map((t) => <Transaction key={t.id} item={t} />) : <div className="empty"><b>No payment activity yet.</b></div>}
      </div>
    </Page>
  );
}
function Feature({ icon: Icon, title, text, click }) {
  return <button className="feature" onClick={click}><span><Icon size={22} /></span><div><b>{title}</b><p>{text}</p></div><ChevronRight size={18} /></button>;
}
function Investments() {
  return (
    <Page title="Investments" subtitle="Track your portfolio and future wealth.">
      <div className="investment-card"><small>PORTFOLIO VALUE</small><strong>$0.00</strong><div><TrendingUp size={18} /> 0.00% today</div></div>
      <div className="panel"><div className="section-heading"><h2>Watchlist</h2></div>
        <div className="watch-row"><span>Aether Index</span><b>$0.00</b><small>0.00%</small></div>
        <div className="watch-row"><span>Aether Bond</span><b>$0.00</b><small>0.00%</small></div>
      </div>
    </Page>
  );
}
function Support({ flash }) {
  const [expanded, setExpanded] = useState(0);
  const faqs = [
    ['How do transfers work?', 'Internal transfers are usually instant. Zelle is typically minutes. ACH to another U.S. bank usually takes 1–3 business days.'],
    ['What are my daily limits?', 'Daily purchase, transfer, and ATM limits vary by account. Check your account agreement or contact support.'],
    ['How do I freeze a lost card?', 'Open Cards and use Freeze card to block new purchases and ATM withdrawals, then contact support if needed.'],
    ['When do direct deposits post?', 'Posting time depends on the sender and the receiving bank processing schedule.'],
  ];
  return (
    <Page title="Support" subtitle="Guidance for everyday banking and account security.">
      <div className="support-hero"><div className="support-orb"><CircleHelp size={26} /></div><div><b>How can we help?</b><p>Browse common banking questions or reach the support team.</p></div></div>
      <div className="faq-list">{faqs.map(([q, a], i) => (
        <section className={'faq-item ' + (expanded === i ? 'expanded' : '')} key={q}>
          <button className="faq-question" aria-expanded={expanded === i} onClick={() => setExpanded(expanded === i ? -1 : i)}><span>{q}</span><ChevronRight size={18} /></button>
          {expanded === i && <p className="faq-answer">{a}</p>}
        </section>
      ))}</div>
      <button className="primary-button" onClick={() => flash('Support request has been submitted.')}>Contact support</button>
    </Page>
  );
}
function Profile({ member, emailAddress, phoneNumber, theme, changeTheme, notifications, changeNotifications }) {
  return (
    <Page title="Profile" subtitle="Personal details and preferences.">
      <div className="panel">
        <div className="balance-row"><div><p>Name</p></div><strong>{member.name}</strong></div>
        <div className="balance-row"><div><p>Account</p></div><strong>••••{member.accountNumber.slice(-4)}</strong></div>
        <div className="balance-row"><div><p>Email</p></div><strong>{emailAddress || 'Not set'}</strong></div>
        <div className="balance-row"><div><p>Phone</p></div><strong>{phoneNumber || 'Not set'}</strong></div>
      </div>
      <div className="panel" style={{ marginTop: 12 }}>
        <h2>Preferences</h2>
        <button className="feature" onClick={() => changeTheme(theme === 'dark' ? 'light' : 'dark')}><span>{theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}</span><div><b>Theme</b><p>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p></div><ChevronRight size={18} /></button>
        <button className="feature" onClick={() => changeNotifications(!notifications)}><span>{notifications ? <Bell size={22} /> : <BellOff size={22} />}</span><div><b>Notifications</b><p>{notifications ? 'On' : 'Off'}</p></div><ChevronRight size={18} /></button>
      </div>
    </Page>
  );
}
function Drawer({ close, page, setPage, settings }) {
  return (
    <div className="drawer-backdrop" onClick={close}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head"><strong>AetherBank</strong><button onClick={close}><X size={20} /></button></div>
        <button className={page === 'home' ? 'active' : ''} onClick={() => { setPage('home'); close(); }}>Home</button>
        <button className={page === 'payments' ? 'active' : ''} onClick={() => { setPage('payments'); close(); }}>Payments</button>
        <button className={page === 'investments' ? 'active' : ''} onClick={() => { setPage('investments'); close(); }}>Investments</button>
        <button className={page === 'support' ? 'active' : ''} onClick={() => { setPage('support'); close(); }}>Support</button>
        <button className={page === 'profile' ? 'active' : ''} onClick={() => { setPage('profile'); close(); }}>Profile</button>
        <button onClick={settings}>Settings</button>
      </div>
    </div>
  );
}

function TransferFlow({ member, members, transferToMember, transferToSavings, transferExternal, transferZelle, flash }) {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState('internal');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [bankQuery, setBankQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [routing, setRouting] = useState('');
  const [extAccount, setExtAccount] = useState('');
  const [holderName, setHolderName] = useState('');
  const [zelleContact, setZelleContact] = useState('');
  const [zelleName, setZelleName] = useState('');
  const otherMembers = members.filter((m) => m.id !== member.id);
  const filteredBanks = US_BANKS.filter((b) => b.name.toLowerCase().includes(bankQuery.toLowerCase()));
  const goNext = () => {
    if (step === 0) { setStep(1); return; }
    if (step === 1) {
      if (kind === 'internal' && !recipient && recipient !== 'savings') return flash('Choose a destination.');
      if (kind === 'external' && !selectedBank && !routing) return flash('Select a bank or enter a routing number.');
      if (kind === 'external' && !extAccount) return flash('Enter the account number.');
      if (kind === 'zelle' && !zelleContact) return flash('Enter email or U.S. mobile number.');
      setStep(2); return;
    }
    if (step === 2) { if (!(Number(amount) > 0)) return flash('Enter a valid amount.'); setStep(3); return; }
    if (step === 3) {
      if (kind === 'internal') { if (recipient === 'savings') transferToSavings(amount); else transferToMember(amount, recipient); }
      else if (kind === 'external') { transferExternal(amount, selectedBank ? selectedBank.name : 'External bank', selectedBank ? selectedBank.routing : routing, extAccount, holderName); }
      else { transferZelle(amount, zelleContact, zelleName); }
    }
  };
  return (
    <>
      {step === 0 && (
        <>
          <p className="modal-note">Available: {money(member.checking)}</p>
          <p className="modal-section">How do you want to send money?</p>
          <button className={'recipient-option ' + (kind === 'internal' ? 'selected' : '')} onClick={() => setKind('internal')}><b>Between my accounts</b><small>Checking ↔ Savings · usually instant</small></button>
          <button className={'recipient-option ' + (kind === 'zelle' ? 'selected' : '')} onClick={() => setKind('zelle')}><b>Send with Zelle</b><small>Email or U.S. mobile · usually minutes</small></button>
          <button className={'recipient-option ' + (kind === 'external' ? 'selected' : '')} onClick={() => setKind('external')}><b>To another U.S. bank (ACH)</b><small>1–3 business days · choose bank from list</small></button>
          <button className="primary-button" onClick={goNext}>Continue</button>
        </>
      )}
      {step === 1 && kind === 'internal' && (
        <>
          <p className="modal-section">Destination</p>
          <button className={'recipient-option ' + (recipient === 'savings' ? 'selected' : '')} onClick={() => setRecipient('savings')}><b>Savings</b><small>Available {money(member.savings)}</small></button>
          {otherMembers.map((m) => (
            <button key={m.id} className={'recipient-option ' + (recipient === m.accountNumber ? 'selected' : '')} onClick={() => setRecipient(m.accountNumber)}><b>{m.name}</b><small>••••{m.accountNumber.slice(-4)}</small></button>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="primary-button" style={{ flex: 1, background: '#555' }} onClick={() => setStep(0)}>Back</button>
            <button className="primary-button" style={{ flex: 1 }} onClick={goNext}>Continue</button>
          </div>
        </>
      )}
      {step === 1 && kind === 'external' && (
        <>
          <p className="modal-section">Select a U.S. bank</p>
          <input type="search" placeholder="Search banks..." value={bankQuery} onChange={(e) => setBankQuery(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 10, borderRadius: 8, border: '1px solid #ccc' }} />
          <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 8 }}>
            {filteredBanks.map((b) => (
              <button key={b.name} className={'recipient-option ' + (selectedBank && selectedBank.name === b.name ? 'selected' : '')} onClick={() => { setSelectedBank(b); setRouting(b.routing); }}>
                <b>{b.name}</b><small>Routing {b.routing}</small>
              </button>
            ))}
          </div>
          <label>Account number<input type="text" placeholder="Account number" value={extAccount} onChange={(e) => setExtAccount(e.target.value)} /></label>
          <label>Account holder name<input type="text" placeholder="Name on the account" value={holderName} onChange={(e) => setHolderName(e.target.value)} /></label>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="primary-button" style={{ flex: 1, background: '#555' }} onClick={() => setStep(0)}>Back</button>
            <button className="primary-button" style={{ flex: 1 }} onClick={goNext}>Continue</button>
          </div>
        </>
      )}
      {step === 1 && kind === 'zelle' && (
        <>
          <p className="modal-section">Recipient</p>
          <label>Email or U.S. mobile<input type="text" placeholder="name@email.com or (555) 123-4567" value={zelleContact} onChange={(e) => setZelleContact(e.target.value)} /></label>
          <label>Name (optional)<input type="text" placeholder="For your records" value={zelleName} onChange={(e) => setZelleName(e.target.value)} /></label>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="primary-button" style={{ flex: 1, background: '#555' }} onClick={() => setStep(0)}>Back</button>
            <button className="primary-button" style={{ flex: 1 }} onClick={goNext}>Continue</button>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <p className="modal-note">Available: {money(member.checking)}</p>
          <label>Amount<input type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="primary-button" style={{ flex: 1, background: '#555' }} onClick={() => setStep(1)}>Back</button>
            <button className="primary-button" style={{ flex: 1 }} onClick={goNext}>Continue</button>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <p className="modal-section">Review transfer</p>
          <div className="detail-row"><span>From</span><b>Personal Checking</b></div>
          <div className="detail-row"><span>To</span><b>
            {kind === 'internal' ? (recipient === 'savings' ? 'Savings' : ((otherMembers.find((m) => m.accountNumber === recipient) || {}).name || 'Member')) : ''}
            {kind === 'external' ? ((selectedBank && selectedBank.name) || 'External bank') + ' ••••' + String(extAccount).slice(-4) : ''}
            {kind === 'zelle' ? (zelleName || zelleContact) : ''}
          </b></div>
          <div className="detail-row"><span>Amount</span><b>{money(Number(amount) || 0)}</b></div>
          <div className="detail-row"><span>Speed</span><b>{kind === 'internal' ? 'Usually instant' : kind === 'zelle' ? 'Usually minutes' : '1–3 business days'}</b></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="primary-button" style={{ flex: 1, background: '#555' }} onClick={() => setStep(2)}>Back</button>
            <button className="primary-button" style={{ flex: 1 }} onClick={goNext}>Confirm & send</button>
          </div>
        </>
      )}
    </>
  );
}

function Modal({ type, close, member, members, transferToMember, transferToSavings, transferExternal, transferZelle, withdraw, debit, theme, changeTheme, notifications, changeNotifications, transactions, flash, physicalFrozen, setPhysicalFrozen, globalSearch, setGlobalSearch }) {
  const [amount, setAmount] = useState('');
  const [payee, setPayee] = useState('');
  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <strong>
            {type === 'transfer' && 'Transfer'}
            {type === 'withdraw' && 'Withdraw'}
            {type === 'pay' && 'Pay Bills'}
            {type === 'cards' && 'Cards'}
            {type === 'account-details' && 'Account Details'}
            {type === 'transactions' && 'Transactions'}
            {type === 'settings' && 'Settings'}
            {type === 'search' && 'Search'}
            {type === 'scan' && 'Scan to Pay'}
          </strong>
          <button onClick={close}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {type === 'transfer' && <TransferFlow member={member} members={members} transferToMember={transferToMember} transferToSavings={transferToSavings} transferExternal={transferExternal} transferZelle={transferZelle} flash={flash} />}
          {type === 'withdraw' && (
            <>
              <p className="modal-note">Available: {money(member.checking)}</p>
              <label>Amount<input type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
              <button className="recipient-option selected"><b>To external bank / cash</b><small>Processed from Checking</small></button>
              <button className="primary-button" onClick={() => withdraw(amount)}>Confirm withdrawal</button>
            </>
          )}
          {type === 'pay' && (
            <>
              <p className="modal-note">Available: {money(member.checking)}</p>
              <label>Amount<input type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
              <label>Payee / merchant<input type="text" placeholder="e.g. Electric company" value={payee} onChange={(e) => setPayee(e.target.value)} /></label>
              <button className="primary-button" onClick={() => debit(amount, payee || 'Bill payment')}>Pay now</button>
            </>
          )}
          {type === 'cards' && (
            <>
              <div className="bank-card modal-card"><div className="mini-brand"><span>AE</span>AetherBank</div><div className="chip" /><div className="card-name">{member.name}</div><div className="last-four">•••• {CARD_NUMBER.slice(-4)}</div></div>
              <p className="modal-note">{physicalFrozen ? 'Card is frozen' : 'Card is active'}</p>
              <button className="primary-button" onClick={() => { setPhysicalFrozen(!physicalFrozen); flash(physicalFrozen ? 'Card unfrozen.' : 'Card frozen.'); }}>{physicalFrozen ? 'Unfreeze card' : 'Freeze card'}</button>
            </>
          )}
          {type === 'account-details' && (
            <>
              <div className="detail-row"><span>Account holder</span><b>{member.name}</b></div>
              <div className="detail-row"><span>Account number</span><b>{member.accountNumber}</b></div>
              <div className="detail-row"><span>Routing number</span><b>{ROUTING_NUMBER}</b></div>
              <div className="detail-row"><span>Account type</span><b>Checking</b></div>
              <div className="detail-row"><span>Status</span><b>Active · Member FDIC</b></div>
              <button className="primary-button" onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(member.accountNumber); flash('Account number copied.'); }}>Copy account number</button>
            </>
          )}
          {type === 'transactions' && (<>{transactions.length ? transactions.map((t) => <Transaction key={t.id} item={t} />) : <div className="empty"><b>No transactions yet</b></div>}</>)}
          {type === 'settings' && (
            <>
              <button className="feature" onClick={() => changeTheme(theme === 'dark' ? 'light' : 'dark')}><span>{theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}</span><div><b>Theme</b><p>{theme === 'dark' ? 'Switch to light' : 'Switch to dark'}</p></div></button>
              <button className="feature" onClick={() => changeNotifications(!notifications)}><span>{notifications ? <Bell size={22} /> : <BellOff size={22} />}</span><div><b>Notifications</b><p>{notifications ? 'Turn off' : 'Turn on'}</p></div></button>
            </>
          )}
          {type === 'search' && (
            <>
              <input type="search" placeholder="Search transactions..." value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} autoFocus style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid #ccc' }} />
              {transactions.filter((t) => !globalSearch || ((t.merchant || '') + ' ' + (t.note || '')).toLowerCase().includes(globalSearch.toLowerCase())).map((t) => <Transaction key={t.id} item={t} />)}
            </>
          )}
          {type === 'scan' && <div className="empty"><QrCode size={48} /><b>Scan to Pay</b><p>Point your camera at a merchant QR code to pay.</p></div>}
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
