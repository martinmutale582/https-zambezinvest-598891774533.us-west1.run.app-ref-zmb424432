/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// --- TYPE DEFINITIONS ---
type Page = 'dashboard' | 'wallet' | 'invest' | 'deposit' | 'withdrawal' | 'profile';
type TransactionStatus = 'success' | 'pending' | 'failed';
type UserRole = 'user' | 'admin';
type User = {
    name: string;
    email: string;
    balance: number;
    dailyProfit: number;
    referralLink: string;
    referralCode: string;
};
type Transaction = {
    id: number;
    type: 'deposit' | 'withdrawal' | 'profit' | 'adjustment';
    description: string;
    amount: number;
    date: string;
    status: TransactionStatus;
};
type UserData = {
    user: User;
    transactions: Transaction[];
};
type AppSettings = {
    platformName: string;
    depositName: string;
    depositNumber: string;
};


// --- MOCK DATA & DEFAULTS ---
const MOCK_PRODUCTS = [
    { name: "Starter Plan", dailyProfit: "5%", min: 250, max: 2500 },
    { name: "Pro Plan", dailyProfit: "8.5%", min: 2501, max: 10000 },
    { name: "Executive Plan", dailyProfit: "12%", min: 10001, max: 50000 },
    { name: "VIP Plan", dailyProfit: "15%", min: 50001, max: 200000 },
];
const DEFAULT_SETTINGS: AppSettings = {
    platformName: "Zambezinvest",
    depositName: "martin mutale",
    depositNumber: "0978310594",
};

// --- LOCALSTORAGE HELPERS ---
const getAllUsers = (): Record<string, UserData> => {
    return JSON.parse(localStorage.getItem('zambezinvest_users') || '{}');
};
const saveAllUsers = (users: Record<string, UserData>) => {
    localStorage.setItem('zambezinvest_users', JSON.stringify(users));
};
const getSettings = (): AppSettings => {
    const saved = localStorage.getItem('zambezinvest_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
};
const saveSettings = (settings: AppSettings) => {
    localStorage.setItem('zambezinvest_settings', JSON.stringify(settings));
};


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
                        <p className={`amount font-bold text-lg ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                           {tx.amount > 0 ? '+ ' : '- '}K {Math.abs(tx.amount).toFixed(2)}
                        </p>
                        <span className={`status-badge ${tx.status}`}>{tx.status}</span>
                    </div>
                </li>
            ))}
        </ul>
    );
};


// --- PAGE COMPONENTS ---
const DashboardPage: React.FC<{ user: User, transactions: Transaction[], setPage: (page: Page) => void }> = ({ user, transactions, setPage }) => {
    // A check for old data structure where link included ref. New structure is base link + code.
    const fullReferralLink = user.referralLink.includes('?ref=')
        ? user.referralLink
        : `${user.referralLink}?ref=${user.referralCode}`;

    const handleCopyReferral = () => {
        navigator.clipboard.writeText(fullReferralLink).then(() => {
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
                    <input type="text" readOnly value={fullReferralLink} className="input-field flex-grow" />
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
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

    useEffect(() => {
        setSettings(getSettings());
    }, []);

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
                                <p><span className="font-semibold text-gray-400">Name:</span> {settings.depositName}</p>
                                <p><span className="font-semibold text-gray-400">Number:</span> {settings.depositNumber}</p>
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
const WithdrawalPage: React.FC<{ userBalance: number, addTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => void }> = ({ userBalance, addTransaction }) => {
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        const formData = new FormData(e.currentTarget);
        const amount = parseFloat(formData.get('amount') as string || '0');
        if (amount > userBalance) {
            setError('Withdrawal amount cannot exceed your balance.');
            return;
        }
        if (amount > 0) {
            addTransaction({
                type: 'withdrawal',
                description: 'Withdrawal to Airtel Money',
                amount: amount,
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
                    <p className="text-gray-300 mt-2">Your withdrawal request is pending. Funds will be sent to your Airtel account within 12 hours.</p>
                </div>
             ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <p className="text-gray-400">Your current balance: K {userBalance.toFixed(2)}</p>
                    <div>
                        <label className="block mb-1 font-medium">Amount to Withdraw (K)</label>
                        <input type="number" name="amount" required className="input-field" placeholder="e.g., 1000" min="1" max={userBalance} />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Your Airtel Number</label>
                        <input type="tel" required className="input-field" placeholder="e.g., 097xxxxxxx" />
                    </div>
                    {error && <p className="auth-error">{error}</p>}
                    <button type="submit" className="btn btn-primary w-full">Submit Request</button>
                </form>
             )}
        </div>
    );
};
const ProfilePage: React.FC<{ user: User, onLogout: () => void }> = ({ user, onLogout }) => {
    const fullReferralLink = user.referralLink.includes('?ref=')
        ? user.referralLink
        : `${user.referralLink}?ref=${user.referralCode}`;

    return (
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
                    <p className="text-lg mt-1 break-all">{fullReferralLink}</p>
                </div>
                <button onClick={onLogout} className="btn btn-primary w-full !mt-8">Log Out</button>
            </div>
        </div>
    );
};


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
    const settings = getSettings();
    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">{settings.platformName}</div>
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
const AuthPage: React.FC<{ onSignup: (name: string, email: string, referralCode?: string) => void, onLogin: (data: UserData) => void, onAdminLogin: () => void }> = ({ onSignup, onLogin, onAdminLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isLogin) {
            const storedRefCode = localStorage.getItem('zambezinvest_referral_code');
            if (storedRefCode) {
                setReferralCode(storedRefCode);
            }
        }
    }, [isLogin]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (isLogin) {
             // Hardcoded admin login
            if (email === 'admin@zambez.app' && password === 'admin123') {
                onAdminLogin();
                return;
            }
            const allUsersData = getAllUsers();
            const userData = allUsersData[email];
            if (userData) {
                onLogin(userData);
            } else {
                setError("No account found with this email.");
            }
        } else { // Signup
            const allUsersData = getAllUsers();
            if (allUsersData[email]) {
                setError("An account with this email already exists.");
            } else {
                onSignup(name, email, referralCode);
            }
        }
    };

    const handleModeChange = () => {
        setIsLogin(!isLogin);
        setError('');
        setName('');
        setEmail('');
        setPassword('');
        setReferralCode('');
    };
    const settings = getSettings();
    return (
        <div className="auth-container">
            <div className="card auth-card">
                <h2 className="text-3xl font-bold text-center mb-2">
                    Welcome to <span className="text-green-400">{settings.platformName}</span>
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
                        <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} required className="input-field" placeholder="••••••••" />
                    </div>
                    {!isLogin && (
                         <div>
                            <label className="block mb-1 font-medium">Referral Code (Optional)</label>
                            <input type="text" className="input-field" placeholder="e.g., zmb12345" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} />
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

// --- ADMIN COMPONENTS ---
const AdminSettings: React.FC<{ onSettingsSaved: () => void }> = ({ onSettingsSaved }) => {
    const [settings, setSettings] = useState<AppSettings>(getSettings());
    const [feedback, setFeedback] = useState('');
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveSettings(settings);
        setFeedback('Settings saved successfully!');
        onSettingsSaved();
        setTimeout(() => setFeedback(''), 3000);
    };

    return (
        <div className="card">
            <h3 className="text-xl font-semibold mb-4">Platform Settings</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block mb-1 font-medium">Platform Name</label>
                    <input type="text" name="platformName" value={settings.platformName} onChange={handleChange} className="input-field" />
                </div>
                 <div>
                    <label className="block mb-1 font-medium">Deposit Recipient Name</label>
                    <input type="text" name="depositName" value={settings.depositName} onChange={handleChange} className="input-field" />
                </div>
                 <div>
                    <label className="block mb-1 font-medium">Deposit Recipient Number</label>
                    <input type="text" name="depositNumber" value={settings.depositNumber} onChange={handleChange} className="input-field" />
                </div>
                <button type="submit" className="btn btn-primary w-full">Save Settings</button>
                {feedback && <p className="text-green-400 mt-4 text-center">{feedback}</p>}
            </form>
        </div>
    );
};

const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    type AdminPage = 'users' | 'settings';
    const [allUsers, setAllUsers] = useState<Record<string, UserData>>(getAllUsers());
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [adminPage, setAdminPage] = useState<AdminPage>('users');
    const [showAddUserForm, setShowAddUserForm] = useState(false);

    const refreshData = useCallback(() => {
        const currentUsers = getAllUsers();
        setAllUsers(currentUsers);
        if (selectedUser) {
            const updatedSelectedUser = currentUsers[selectedUser.user.email];
            setSelectedUser(updatedSelectedUser || null);
        }
    }, [selectedUser]);

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'zambezinvest_users' || event.key === 'zambezinvest_settings') {
                refreshData();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [refreshData]);

    const handleTransactionStatus = (userEmail: string, txId: number, newStatus: 'success' | 'failed') => {
        const updatedUsers = { ...allUsers };
        const userData = updatedUsers[userEmail];
        if (!userData) return;

        const tx = userData.transactions.find(t => t.id === txId);
        if (tx && tx.status === 'pending') {
            tx.status = newStatus;
            if (newStatus === 'success') {
                 if (tx.type === 'deposit') {
                    userData.user.balance += tx.amount;
                } else if (tx.type === 'withdrawal') {
                    // Withdrawals are stored as negative, so adding them correctly subtracts
                    userData.user.balance += tx.amount;
                }
            }
        }
        saveAllUsers(updatedUsers);
        refreshData();
    };

    const handleAdjustBalance = (userEmail: string, amount: number, reason: string) => {
        const updatedUsers = { ...allUsers };
        const userData = updatedUsers[userEmail];
        if (!userData || !reason) return;

        userData.user.balance += amount;
        const newTx: Transaction = {
            id: Date.now(),
            type: 'adjustment',
            description: `Admin: ${reason}`,
            amount: amount,
            date: new Date().toISOString().split('T')[0],
            status: 'success'
        };
        userData.transactions.unshift(newTx);
        saveAllUsers(updatedUsers);
        refreshData();
    };
    
    const handleCreateUser = (name: string, email: string) => {
        const allUsersData = getAllUsers();
        if (allUsersData[email]) {
            alert("An account with this email already exists.");
            return;
        }

        const refId = 'zmb' + Date.now().toString().slice(-6);
        const genericReferralLink = `${window.location.origin}${window.location.pathname}`;
        const newUser: User = { 
            name, 
            email, 
            balance: 0, 
            dailyProfit: 0.00, 
            referralCode: refId, 
            referralLink: genericReferralLink 
        };

        allUsersData[email] = { user: newUser, transactions: [] };
        saveAllUsers(allUsersData);
        refreshData();
        setShowAddUserForm(false);
        alert('User created successfully!');
    };

    const AddUserForm: React.FC<{ onCreate: (name: string, email: string) => void, onCancel: () => void }> = ({ onCreate, onCancel }) => {
        const [name, setName] = useState('');
        const [email, setEmail] = useState('');

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (name && email) {
                onCreate(name, email);
            } else {
                alert('Please fill in both name and email.');
            }
        };

        return (
            <div className="card my-4 p-4 border border-blue-500">
                <h4 className="text-lg font-bold mb-4">Add New Member</h4>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-medium">Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="e.g., Jane Doe" required />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="e.g., jane.doe@example.com" required />
                    </div>
                    <div className="flex gap-4 mt-4">
                        <button type="submit" className="btn btn-primary flex-grow">Create User</button>
                        <button type="button" onClick={onCancel} className="btn bg-gray-600 hover:bg-gray-700 flex-grow">Cancel</button>
                    </div>
                </form>
            </div>
        );
    };

    const UserDetails: React.FC<{ userData: UserData }> = ({ userData }) => {
        const [adjAmount, setAdjAmount] = useState<number | ''>('');
        const [adjReason, setAdjReason] = useState('');

        const onAdjust = () => {
             if (adjAmount !== '' && adjAmount !== 0 && adjReason) {
                handleAdjustBalance(userData.user.email, Number(adjAmount), adjReason);
                setAdjAmount('');
                setAdjReason('');
            } else {
                alert('Please enter a non-zero amount and a reason.');
            }
        };

        return (
             <div className="card mt-4">
                <h4 className="text-lg font-bold">Details for {userData.user.name} ({userData.user.email})</h4>
                <p>Balance: K {userData.user.balance.toFixed(2)}</p>

                <div className="my-4 p-4 border border-gray-600 rounded-lg">
                    <h5 className="font-semibold mb-2">Adjust Balance</h5>
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <input type="number" value={adjAmount} onChange={e => setAdjAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} className="input-field" placeholder="Amount (e.g. 50 or -50)" />
                        <input type="text" value={adjReason} onChange={e => setAdjReason(e.target.value)} className="input-field flex-grow" placeholder="Reason (e.g. Bonus)" />
                        <button onClick={onAdjust} className="btn btn-primary bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">Apply</button>
                    </div>
                </div>

                <h5 className="font-semibold mt-4 mb-2">Transaction History</h5>
                <ul className="transaction-list">
                    {userData.transactions.length > 0 ? userData.transactions.map(tx => (
                        <li key={tx.id} className={`transaction-item ${tx.type}`}>
                            <div className="transaction-details">
                                <p className="font-semibold">{tx.description}</p>
                                <p className="text-sm text-gray-400">{tx.date}</p>
                            </div>
                            <div className="text-right">
                                <p className={`amount font-bold text-lg ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {tx.amount > 0 ? '+ ' : '- '}K {Math.abs(tx.amount).toFixed(2)}
                                </p>
                                {tx.status === 'pending' ? (
                                    <div className="flex gap-2 justify-end mt-1">
                                        <button onClick={() => handleTransactionStatus(userData.user.email, tx.id, 'success')} className="btn-sm bg-green-600 hover:bg-green-700">Approve</button>
                                        <button onClick={() => handleTransactionStatus(userData.user.email, tx.id, 'failed')} className="btn-sm bg-red-600 hover:bg-red-700">Reject</button>
                                    </div>
                                ) : (
                                    <span className={`status-badge ${tx.status}`}>{tx.status}</span>
                                )}
                            </div>
                        </li>
                    )) : <p className="text-gray-400">No transactions for this user.</p>}
                </ul>
            </div>
        )
    };
    
    return (
        <div className="admin-dashboard p-4 md:p-8">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Admin Panel</h1>
                <button onClick={onLogout} className="btn btn-primary">{ICONS.logout} Log Out</button>
            </header>

            <div className="flex gap-4 mb-6 border-b border-gray-600">
                <button onClick={() => setAdminPage('users')} className={`admin-tab ${adminPage === 'users' ? 'active' : ''}`}>Manage Users</button>
                <button onClick={() => setAdminPage('settings')} className={`admin-tab ${adminPage === 'settings' ? 'active' : ''}`}>Settings</button>
            </div>
            
            {adminPage === 'users' && (
                <div className="card">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                        <h2 className="text-2xl font-semibold">Users</h2>
                        {!showAddUserForm && (
                           <button onClick={() => setShowAddUserForm(true)} className="btn btn-primary bg-blue-600 hover:bg-blue-700">Add New Member</button>
                        )}
                    </div>
                    
                    {showAddUserForm && <AddUserForm onCreate={handleCreateUser} onCancel={() => setShowAddUserForm(false)} />}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-600">
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Email</th>
                                    <th className="p-2">Balance</th>
                                    <th className="p-2">Pending Txs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(allUsers).map(({ user, transactions }) => (
                                    <tr key={user.email} onClick={() => setSelectedUser(allUsers[user.email])} className="cursor-pointer hover:bg-gray-700 border-b border-gray-700">
                                        <td className="p-2">{user.name}</td>
                                        <td className="p-2">{user.email}</td>
                                        <td className="p-2">K {user.balance.toFixed(2)}</td>
                                        <td className="p-2">{transactions.filter(t => t.status === 'pending').length}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {selectedUser && <UserDetails userData={selectedUser} />}
                </div>
            )}

            {adminPage === 'settings' && <AdminSettings onSettingsSaved={refreshData} />}
        </div>
    );
};

// --- MAIN APP COMPONENT ---
function App() {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        // Capture referral code from URL on initial load
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        if (refCode) {
            localStorage.setItem('zambezinvest_referral_code', refCode);
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Check for existing session
        const sessionRole = localStorage.getItem('zambezinvest_session_role') as UserRole;
        const sessionEmail = localStorage.getItem('zambezinvest_session_email');
        if (sessionRole && sessionEmail) {
            if (sessionRole === 'admin') {
                setUserRole('admin');
            } else {
                const allUsersData = getAllUsers();
                const userData = allUsersData[sessionEmail];
                if (userData) {
                    setUser(userData.user);
                    setTransactions(userData.transactions);
                    setUserRole('user');
                }
            }
        }
    }, []);

    const persistData = (userData: User, txData: Transaction[]) => {
        const allUsersData = getAllUsers();
        allUsersData[userData.email] = { user: userData, transactions: txData };
        saveAllUsers(allUsersData);
    };

    const handleSignup = (name: string, email: string, referralCode?: string) => {
        const newTransactions: Transaction[] = [];
        let welcomeBonus = 0;

        if (referralCode) {
            const allUsersData = getAllUsers();
            let referrerData: UserData | undefined;
            let referrerEmail: string | undefined;

            for (const [userEmail, userData] of Object.entries(allUsersData)) {
                if (userData.user.referralCode === referralCode.trim()) {
                    referrerData = userData;
                    referrerEmail = userEmail;
                    break;
                }
            }

            if (referrerData && referrerEmail) {
                const REFERRER_BONUS = 25;
                referrerData.user.balance += REFERRER_BONUS;
                const referrerBonusTx: Transaction = { id: Date.now() + 1, type: 'profit', description: `Referral bonus for ${name}`, amount: REFERRER_BONUS, date: new Date().toISOString().split('T')[0], status: 'success' };
                referrerData.transactions.unshift(referrerBonusTx);
                allUsersData[referrerEmail] = referrerData;
                
                const NEW_USER_BONUS = 10;
                welcomeBonus = NEW_USER_BONUS;
                const newUserBonusTx: Transaction = { id: Date.now(), type: 'deposit', description: `Welcome bonus from referral`, amount: NEW_USER_BONUS, date: new Date().toISOString().split('T')[0], status: 'success' };
                newTransactions.push(newUserBonusTx);
                
                localStorage.removeItem('zambezinvest_referral_code');
                saveAllUsers(allUsersData);
            }
        }
        
        const refId = 'zmb' + Date.now().toString().slice(-6);
        const genericReferralLink = `${window.location.origin}${window.location.pathname}`;
        const newUser: User = { name, email, balance: welcomeBonus, dailyProfit: 0.00, referralCode: refId, referralLink: genericReferralLink };
        
        setUser(newUser);
        setTransactions(newTransactions);
        setUserRole('user');
        persistData(newUser, newTransactions);
        localStorage.setItem('zambezinvest_session_role', 'user');
        localStorage.setItem('zambezinvest_session_email', newUser.email);
        setCurrentPage('dashboard');
    };
    
    const handleLogin = (data: UserData) => {
        setUser(data.user);
        setTransactions(data.transactions);
        setUserRole('user');
        localStorage.setItem('zambezinvest_session_role', 'user');
        localStorage.setItem('zambezinvest_session_email', data.user.email);
        setCurrentPage('dashboard');
    };

    const handleAdminLogin = () => {
        setUserRole('admin');
        localStorage.setItem('zambezinvest_session_role', 'admin');
        localStorage.setItem('zambezinvest_session_email', 'admin@zambez.app');
    };

    const handleLogout = () => {
        localStorage.removeItem('zambezinvest_session_role');
        localStorage.removeItem('zambezinvest_session_email');
        setUser(null);
        setUserRole(null);
        setTransactions([]);
    };

    const handleAddTransaction = (tx: Omit<Transaction, 'id' | 'date'>) => {
        if (!user) return;
        
        // Store withdrawal amounts as negative numbers for easier calculations
        const amount = tx.type === 'withdrawal' ? -Math.abs(tx.amount) : tx.amount;

        const newTransaction: Transaction = {
            ...tx,
            amount,
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

    if (!userRole) {
        return <AuthPage onSignup={handleSignup} onLogin={handleLogin} onAdminLogin={handleAdminLogin} />;
    }
    
    if (userRole === 'admin') {
        return <AdminDashboard onLogout={handleLogout} />;
    }

    if (user) {
        const pageContent: Record<Page, React.ReactNode> = {
            dashboard: <DashboardPage user={user} transactions={transactions} setPage={handleSetPage} />,
            wallet: <WalletPage user={user} transactions={transactions} />,
            invest: <InvestPage setPage={handleSetPage} />,
            deposit: <DepositPage addTransaction={handleAddTransaction} />,
            withdrawal: <WithdrawalPage userBalance={user.balance} addTransaction={handleAddTransaction} />,
            profile: <ProfilePage user={user} onLogout={handleLogout} />
        };

        return (
            <div className="app-layout">
                <Sidebar activePage={currentPage} setPage={handleSetPage} onLogout={handleLogout} isOpen={isSidebarOpen} />
                 {isSidebarOpen && <div className="overlay md:hidden" onClick={() => setSidebarOpen(false)}></div>}
                <main className="main-content">
                    <Header page={currentPage} onMenuClick={() => setSidebarOpen(true)} />
                    {pageContent[currentPage]}
                </main>
            </div>
        );
    }

    return null; // Should not happen if logic is correct
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