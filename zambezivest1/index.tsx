/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// --- TYPE DEFINITIONS ---
type Page = 'dashboard' | 'wallet' | 'invest' | 'deposit' | 'withdrawal' | 'profile';
type TransactionStatus = 'success' | 'pending' | 'failed';
type User = {
    name: string;
    email: string;
    balance: number;
    dailyProfit: number;
    referralLink: string;
};
type Transaction = {
    id: number;
    type: 'deposit' | 'withdrawal' | 'profit';
    description: string;
    amount: number;
    date: string;
    status: TransactionStatus;
};
type UserData = {
    user: User;
    transactions: Transaction[];
};


// --- MOCK DATA ---
const MOCK_PRODUCTS = [
    { name: "Starter Plan", dailyProfit: "5%", min: 250, max: 2500 },
    { name: "Pro Plan", dailyProfit: "8.5%", min: 2501, max: 10000 },
    { name: "Executive Plan", dailyProfit: "12%", min: 10001, max: 50000 },
    { name: "VIP Plan", dailyProfit: "15%", min: 50001, max: 200000 },
];

// --- ICONS (SVG) ---
const ICONS = {
    dashboard: <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    wallet: <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
    invest: <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    deposit: <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
    withdrawal: <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
    profile: <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    logout: <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
    hamburger: <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>,
    userAvatar: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};


// --- UI COMPONENTS ---
const StatCard: React.FC<{ title: string; value: string; children?: React.ReactNode }> = ({ title, value, children }) => (
    <div className="card">
        <h3 className="text-lg font-medium text-gray-400">{title}</h3>
        <p className="text-3xl font-bold mt-2">{value}</p>
        {children}
    </div>
);

const TransactionHistory: React.FC<{ transactions: Transaction[], limit?: number }> = ({ transactions, limit }) => {
    const transactionsToShow = limit ? transactions.slice(0, limit) : transactions;
    if (transactions.length === 0) {
        return <div className="empty-state">You have no transactions yet.</div>
    }
    return (
        <ul className="transaction-list">
            {transactionsToShow.map(tx => (
                <li key={tx.id} className={`transaction-item ${tx.type}`}>
                    <div className="transaction-details">
                        <p className="font-semibold">{tx.description}</p>
                        <p className="text-sm text-gray-400">{tx.date}</p>
                    </div>
                    <div className="text-right">
                        <p className="amount font-bold text-lg">K {tx.amount.toFixed(2)}</p>
                        <span className={`status-badge ${tx.status}`}>{tx.status}</span>
                    </div>
                </li>
            ))}
        </ul>
    );
};


// --- PAGE COMPONENTS ---
const DashboardPage: React.FC<{ user: User, transactions: Transaction[], setPage: (page: Page) => void }> = ({ user, transactions, setPage }) => {
    const handleCopyReferral = () => {
        navigator.clipboard.writeText(user.referralLink).then(() => {
            alert("Referral link copied to clipboard!");
        });
    };
    return (
        <div>
            <div className="dashboard-header">
                <div className="profile-avatar-sm">{ICONS.userAvatar}</div>
                <div className="welcome-message">
                    <h2>Welcome back, {user.name}!</h2>
                    <p>Here's your account summary.</p>
                </div>
            </div>
            <div className="stats-grid mb-8">
                <StatCard title="Wallet Balance" value={`K ${user.balance.toFixed(2)}`} />
                <StatCard title="Today's Profit" value={`K ${user.dailyProfit.toFixed(2)}`} />
            </div>
             <div className="card mb-8">
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                     <button onClick={() => setPage('deposit')} className="btn btn-primary flex-grow">Deposit Funds</button>
                     <button onClick={() => setPage('invest')} className="btn btn-primary bg-gray-600 hover:bg-gray-700 flex-grow">View Investments</button>
                </div>
            </div>
            <div className="card mb-8">
                <h3 className="text-xl font-semibold mb-4">Your Referral Link</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <input type="text" readOnly value={user.referralLink} className="input-field flex-grow" />
                    <button onClick={handleCopyReferral} className="btn btn-primary">Copy Link</button>
                </div>
            </div>
            <div className="card">
                <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                <TransactionHistory transactions={transactions} limit={4} />
            </div>
        </div>
    );
};
const WalletPage: React.FC<{ user: User; transactions: Transaction[] }> = ({ user, transactions }) => (
    <div>
        <div className="card mb-8">
            <h3 className="text-lg font-medium text-gray-400">Total Balance</h3>
            <p className="text-5xl font-bold mt-2 text-green-400">K {user.balance.toFixed(2)}</p>
        </div>
        <div className="card">
            <h3 className="text-xl font-semibold mb-4">Full Transaction History</h3>
            <TransactionHistory transactions={transactions} />
        </div>
    </div>
);
const InvestPage: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_PRODUCTS.map(product => (
            <div key={product.name} className="card flex flex-col">
                <h3 className="text-2xl font-bold text-green-400">{product.name}</h3>
                <p className="text-4xl font-bold my-4">{product.dailyProfit} <span className="text-lg text-gray-400 font-medium">Daily Profit</span></p>
                <p className="text-gray-400">Investment: K{product.min} - K{product.max}</p>
                <div className="flex-grow"></div>
                <button onClick={() => setPage('deposit')} className="btn btn-primary mt-6 w-full">Invest Now</button>
            </div>
        ))}
    </div>
);
const DepositPage: React.FC<{ addTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => void }> = ({ addTransaction }) => {
    const [submitted, setSubmitted] = useState(false);
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const amount = parseFloat(formData.get('amount') as string || '0');
        if (amount > 0) {
            addTransaction({
                type: 'deposit',
                description: 'Deposit via Airtel Money',
                amount: amount,
                status: 'pending'
            });
        }
        setSubmitted(true);
    };
    return (
        <div className="card max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">Deposit Instructions</h3>
            {submitted ? (
                 <div className="text-center p-8 bg-gray-800 rounded-lg">
                    <h4 className="text-2xl font-bold text-green-400">Proof Submitted!</h4>
                    <p className="text-gray-300 mt-2">Your deposit is now pending review. Your balance will be updated upon confirmation.</p>
                </div>
            ) : (
                <>
                    <ol className="list-decimal list-inside space-y-4 text-gray-300 mb-6">
                        <li>Open your Airtel Money menu.</li>
                        <li>Select "Send Money".</li>
                        <li>Enter the following details exactly:
                            <div className="bg-gray-800 p-4 rounded-lg my-2 border border-gray-600">
                                <p><span className="font-semibold text-gray-400">Name:</span> martin mutale</p>
                                <p><span className="font-semibold text-gray-400">Number:</span> 0978310594</p>
                            </div>
                        </li>
                        <li>After sending, take a screenshot of the confirmation message.</li>
                        <li>Fill out the form below and upload your screenshot.</li>
                    </ol>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="block mb-1 font-medium">Amount Deposited (K)</label>
                            <input type="number" name="amount" required className="input-field" placeholder="e.g., 500" />
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Upload Proof of Payment</label>
                            <input type="file" required className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700" />
                        </div>
                        <button type="submit" className="btn btn-primary w-full">Submit Deposit</button>
                    </form>
                </>
            )}
        </div>
    );
};
const WithdrawalPage: React.FC<{ addTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => void }> = ({ addTransaction }) => {
    const [submitted, setSubmitted] = useState(false);
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const amount = parseFloat(formData.get('amount') as string || '0');
        if (amount > 0) {
            addTransaction({
                type: 'withdrawal',
                description: 'Withdrawal to Airtel Money',
                amount: -amount, // Withdrawals are negative
                status: 'pending'
            });
        }
        setSubmitted(true);
    };
    return (
        <div className="card max-w-lg mx-auto">
             <h3 className="text-xl font-semibold mb-4">Request Withdrawal</h3>
             {submitted ? (
                <div className="text-center p-8 bg-gray-800 rounded-lg">
                    <h4 className="text-2xl font-bold text-green-400">Request Received!</h4>
                    <p className="text-gray-300 mt-2">Your withdrawal request is pending. Funds will be sent to your Airtel account within 24 hours.</p>
                </div>
             ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block mb-1 font-medium">Amount to Withdraw (K)</label>
                        <input type="number" name="amount" required className="input-field" placeholder="e.g., 1000" />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Your Airtel Number</label>
                        <input type="tel" required className="input-field" placeholder="e.g., 097xxxxxxx" />
                    </div>
                    <button type="submit" className="btn btn-primary w-full">Submit Request</button>
                </form>
             )}
        </div>
    );
};
const ProfilePage: React.FC<{ user: User, onLogout: () => void }> = ({ user, onLogout }) => (
    <div className="card max-w-lg mx-auto">
        <div className="profile-avatar-lg">{ICONS.userAvatar}</div>
        <h3 className="text-2xl font-semibold mb-6 text-center">{user.name}</h3>
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-400">Email</label>
                <p className="text-lg mt-1">{user.email}</p>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-400">Referral Link</label>
                <p className="text-lg mt-1 break-all">{user.referralLink}</p>
            </div>
            <button onClick={onLogout} className="btn btn-primary w-full !mt-8">Log Out</button>
        </div>
    </div>
);


// --- LAYOUT COMPONENTS ---
const Sidebar: React.FC<{ activePage: Page; setPage: (page: Page) => void; onLogout: () => void; isOpen: boolean }> = ({ activePage, setPage, onLogout, isOpen }) => {
    const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard },
        { id: 'wallet', label: 'Wallet', icon: ICONS.wallet },
        { id: 'invest', label: 'Invest', icon: ICONS.invest },
        { id: 'deposit', label: 'Deposit', icon: ICONS.deposit },
        { id: 'withdrawal', label: 'Withdrawal', icon: ICONS.withdrawal },
        { id: 'profile', label: 'Profile', icon: ICONS.profile },
    ];
    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">Zambezinvest</div>
            <nav>
                <ul className="nav-list">
                    {navItems.map(item => (
                        <li key={item.id} className="nav-item mb-2">
                            <a href="#" onClick={(e) => { e.preventDefault(); setPage(item.id); }} className={activePage === item.id ? 'active' : ''}>
                                {item.icon}
                                <span>{item.label}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="sidebar-footer">
                <button onClick={onLogout} className="btn btn-primary flex items-center gap-2">
                    {ICONS.logout}
                    <span>Log Out</span>
                </button>
            </div>
        </aside>
    );
};

const Header: React.FC<{ page: Page, onMenuClick: () => void }> = ({ page, onMenuClick }) => {
    const pageTitles: Record<Page, string> = {
        dashboard: 'Dashboard',
        wallet: 'My Wallet',
        invest: 'Investment Products',
        deposit: 'Make a Deposit',
        withdrawal: 'Request a Withdrawal',
        profile: 'My Profile'
    };
    return (
        <header className="header">
            <h1 className="header-title">{pageTitles[page]}</h1>
            <button className="hamburger" onClick={onMenuClick} aria-label="Open menu">
                {ICONS.hamburger}
            </button>
        </header>
    );
};

// --- AUTHENTICATION COMPONENTS ---
const AuthPage: React.FC<{ onSignup: (name: string, email: string) => void, onLogin: (data: UserData) => void }> = ({ onSignup, onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const allUsersData: Record<string, UserData> = JSON.parse(localStorage.getItem('zambezinvest_users') || '{}');

        if (isLogin) {
            const userData = allUsersData[email];
            if (userData) {
                onLogin(userData);
            } else {
                setError("No account found with this email.");
            }
        } else { // Signup
            if (allUsersData[email]) {
                setError("An account with this email already exists.");
            } else {
                onSignup(name, email);
            }
        }
    };

    const handleModeChange = () => {
        setIsLogin(!isLogin);
        setError('');
        setName('');
        setEmail('');
    };

    return (
        <div className="auth-container">
            <div className="card auth-card">
                <h2 className="text-3xl font-bold text-center mb-2">
                    Welcome to <span className="text-green-400">Zambezinvest</span>
                </h2>
                <p className="text-center text-gray-400 mb-8">{isLogin ? "Log in to your verified and trusted wallet" : "Create your account"}</p>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {!isLogin && (
                         <div>
                            <label className="block mb-1 font-medium">Full Name</label>
                            <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} required className="input-field" placeholder="e.g., Martin Mutale" />
                        </div>
                    )}
                    <div>
                        <label className="block mb-1 font-medium">Email Address</label>
                        <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} required className="input-field" placeholder="you@example.com" />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Password</label>
                        <input type="password" required className="input-field" placeholder="••••••••" />
                    </div>
                    {!isLogin && (
                         <div>
                            <label className="block mb-1 font-medium">Referral Code (Optional)</label>
                            <input type="text" className="input-field" placeholder="e.g., zmb12345" />
                        </div>
                    )}
                     {error && <p className="auth-error">{error}</p>}
                    <button type="submit" className="btn btn-primary w-full !mt-8">
                        {isLogin ? "Log In" : "Sign Up"}
                    </button>
                </form>
                <p className="text-center text-gray-400 mt-6">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={handleModeChange} className="font-semibold text-green-400 hover:underline ml-2">
                        {isLogin ? "Sign Up" : "Log In"}
                    </button>
                </p>
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
function App() {
    const [user, setUser] = useState<User | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const sessionEmail = localStorage.getItem('zambezinvest_session');
        if (sessionEmail) {
            const allUsersData = JSON.parse(localStorage.getItem('zambezinvest_users') || '{}');
            const userData = allUsersData[sessionEmail];
            if (userData) {
                setUser(userData.user);
                setTransactions(userData.transactions);
            }
        }
    }, []);

    const persistData = (userData: User, txData: Transaction[]) => {
        const allUsersData = JSON.parse(localStorage.getItem('zambezinvest_users') || '{}');
        allUsersData[userData.email] = { user: userData, transactions: txData };
        localStorage.setItem('zambezinvest_users', JSON.stringify(allUsersData));
    };

    const handleSignup = (name: string, email: string) => {
        const refId = 'zmb' + Date.now().toString().slice(-6);
        const newUser: User = {
            name,
            email,
            balance: 0.00,
            dailyProfit: 0.00,
            referralLink: `https://zambezinvest.com/ref/${refId}`
        };
        const newTransactions: Transaction[] = [];
        
        setUser(newUser);
        setTransactions(newTransactions);
        persistData(newUser, newTransactions);
        localStorage.setItem('zambezinvest_session', newUser.email);
        setCurrentPage('dashboard');
    };
    
    const handleLogin = (data: UserData) => {
        setUser(data.user);
        setTransactions(data.transactions);
        localStorage.setItem('zambezinvest_session', data.user.email);
        setCurrentPage('dashboard');
    };

    const handleLogout = () => {
        localStorage.removeItem('zambezinvest_session');
        setUser(null);
        setTransactions([]);
    };

    const handleAddTransaction = (tx: Omit<Transaction, 'id' | 'date'>) => {
        if (!user) return;
        const newTransaction: Transaction = {
            ...tx,
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
        };
        const newTransactions = [newTransaction, ...transactions];
        setTransactions(newTransactions);
        persistData(user, newTransactions);
    };

    const handleSetPage = (page: Page) => {
        setCurrentPage(page);
        setSidebarOpen(false); // Close sidebar on navigation
    };

    if (!user) {
        return <AuthPage onSignup={handleSignup} onLogin={handleLogin} />;
    }

    const pageContent: Record<Page, React.ReactNode> = {
        dashboard: <DashboardPage user={user} transactions={transactions} setPage={handleSetPage} />,
        wallet: <WalletPage user={user} transactions={transactions} />,
        invest: <InvestPage setPage={handleSetPage} />,
        deposit: <DepositPage addTransaction={handleAddTransaction} />,
        withdrawal: <WithdrawalPage addTransaction={handleAddTransaction} />,
        profile: <ProfilePage user={user} onLogout={handleLogout} />
    };

    return (
        <div className="app-layout">
            <Sidebar 
                activePage={currentPage} 
                setPage={handleSetPage} 
                onLogout={handleLogout}
                isOpen={isSidebarOpen}
            />
             {isSidebarOpen && <div className="overlay md:hidden" onClick={() => setSidebarOpen(false)}></div>}
            <main className="main-content">
                <Header page={currentPage} onMenuClick={() => setSidebarOpen(true)} />
                {pageContent[currentPage]}
            </main>
        </div>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
