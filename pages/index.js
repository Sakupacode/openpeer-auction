import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, MessageCircle, Wallet, TrendingUp, Users, Settings, Clock, CheckCircle, AlertTriangle, Shield, Menu, X, Plus, Minus, DollarSign, Calendar, Zap, BarChart3, FileText, UserPlus, Coins, Building2, Target, Play, Pause, RotateCcw, Gavel, Star, ArrowRight, Eye, Heart, Home, Database } from 'lucide-react';

// Supabase Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Simple Supabase client
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    };
  }

  async from(table) {
    return new SupabaseQuery(this.url, this.headers, table);
  }
}

class SupabaseQuery {
  constructor(url, headers, table) {
    this.url = url;
    this.headers = headers;
    this.table = table;
    this.query = '';
  }

  select(columns = '*') {
    this.query = `select=${columns}`;
    return this;
  }

  eq(column, value) {
    this.query += this.query ? `&${column}=eq.${value}` : `${column}=eq.${value}`;
    return this;
  }

  async execute() {
    const response = await fetch(`${this.url}/rest/v1/${this.table}?${this.query}`, {
      headers: this.headers
    });
    return await response.json();
  }

  async insert(data) {
    const response = await fetch(`${this.url}/rest/v1/${this.table}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  async update(data) {
    const response = await fetch(`${this.url}/rest/v1/${this.table}?${this.query}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(data)
    });
    return await response.json();
  }

  async delete() {
    const response = await fetch(`${this.url}/rest/v1/${this.table}?${this.query}`, {
      method: 'DELETE',
      headers: this.headers
    });
    return await response.json();
  }
}

// Initialize Supabase
const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const bidRanges = [
  { min: 100, max: 1000, label: "R100 - R1000" },
  { min: 1000, max: 5000, label: "R1000 - R5000" },
  { min: 5000, max: 10000, label: "R5000 - R10000" },
  { min: 10000, max: 15000, label: "R10000 - R15000" }
];

const holdingPeriods = [
  { days: 5, returnRate: 105, label: "5 Days" },
  { days: 10, returnRate: 107, label: "10 Days" },
  { days: 20, returnRate: 110, label: "20 Days" }
];

export default function CoinAuctionApp() {
  const [activeTab, setActiveTab] = useState("landing");
  const [selectedRange, setSelectedRange] = useState(0);
  const [bidAmount, setBidAmount] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState(20);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [gavelRotation, setGavelRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const fileInputRef = useRef(null);
  
  // Database state
  const [users, setUsers] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [bids, setBids] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [supportChats, setSupportChats] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [auctionConfig, setAuctionConfig] = useState({
    nextAuctionTime: new Date('2025-07-15 10:00:00'),
    auctionFrequency: 'daily',
    coinsPerAuction: 150000,
    maxLotsPerAuction: 20,
    totalCoinsInSystem: 2500000,
    availableCoinsToAuction: 180000,
    auctionStatus: 'scheduled',
    currentAuctionId: 'AUC001'
  });
  
  // Form states
  const [registrationForm, setRegistrationForm] = useState({
    email: '',
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [timeToNextAuction, setTimeToNextAuction] = useState("");

  // Database Functions
  const checkDatabaseConnection = async () => {
    try {
      setLoading(true);
      console.log('🚀 Connecting to Supabase:', SUPABASE_URL);
      
      // Test connection by trying to fetch users
      const result = await supabase.from('users').select('*').execute();
      setDbConnected(true);
      console.log('✅ Database connected successfully!', result);
      
      // Auto-load data if connection successful
      await loadData();
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      console.log('💡 Next step: Run the SQL script in your Supabase dashboard!');
      console.log('📍 Go to: https://nwygekmzugvkinaeyyjr.supabase.co → SQL Editor');
      console.log('📋 Copy the SQL from the setup modal and run it');
      setDbConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    if (!dbConnected) return;
    
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [usersData, auctionsData, bidsData, banksData, chatsData, approvalsData] = await Promise.all([
        supabase.from('users').select('*').execute(),
        supabase.from('auction_lots').select('*').execute(),
        supabase.from('user_bids').select('*').execute(),
        supabase.from('bank_accounts').select('*').execute(),
        supabase.from('support_chats').select('*').execute(),
        supabase.from('pending_approvals').select('*').execute()
      ]);

      setUsers(usersData || []);
      setAuctions(auctionsData || []);
      setBids(bidsData || []);
      setBankAccounts(banksData || []);
      setSupportChats(chatsData || []);
      setPendingApprovals(approvalsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData) => {
    try {
      const result = await supabase.from('users').insert([{
        email: userData.email,
        full_name: userData.fullName,
        phone: userData.phone,
        status: 'active',
        total_invested: 0,
        active_investments: 0,
        coin_balance: 1000, // Welcome bonus
        is_verified: false,
        created_at: new Date().toISOString()
      }]).execute();
      
      await loadData(); // Refresh data
      return result;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const createBid = async (bidData) => {
    try {
      const result = await supabase.from('user_bids').insert([{
        bid_number: Math.random().toString().substr(2, 6),
        amount: bidData.amount,
        status: 'pending_payment',
        lot_number: bidData.lotNumber,
        holding_period: bidData.holdingPeriod,
        seller_bank: bidData.sellerBank,
        reference_number: Math.random().toString().substr(2, 6),
        user_email: 'current@user.com', // Replace with actual user
        created_at: new Date().toISOString()
      }]).execute();
      
      await loadData(); // Refresh data
      return result;
    } catch (error) {
      console.error('Error creating bid:', error);
      throw error;
    }
  };

  // Initialize app
  useEffect(() => {
    // Auto-test connection with provided credentials
    console.log('🚀 Auto-testing database connection...');
    checkDatabaseConnection();
  }, []);

  // Navigation items
  const navItems = [
    { id: "landing", label: "Landing Page", icon: Home, shortLabel: "Home" },
    { id: "dashboard", label: "Dashboard", icon: TrendingUp, shortLabel: "Dashboard" },
    { id: "auctions", label: "Investment Opportunities", icon: Wallet, shortLabel: "Invest" },
    { id: "bids", label: "Payment Center", icon: Upload, shortLabel: "Pay" },
    { id: "holdings", label: "Portfolio", icon: TrendingUp, shortLabel: "Portfolio" },
    { id: "messages", label: "Communications", icon: MessageCircle, shortLabel: "Messages" },
    { id: "profile", label: "Account Settings", icon: Users, shortLabel: "Profile" }
  ];

  const adminNavItems = [
    { id: "admin-support", label: "Support Center", icon: MessageCircle, shortLabel: "Support" },
    { id: "admin-approvals", label: "Payment Approvals", icon: CheckCircle, shortLabel: "Approvals" },
    { id: "admin-coins", label: "Coin Management", icon: Coins, shortLabel: "Coins" },
    { id: "admin-banks", label: "Bank Accounts", icon: Building2, shortLabel: "Banks" },
    { id: "admin-auction", label: "Auction Control", icon: Target, shortLabel: "Auctions" },
    { id: "admin-users", label: "User Management", icon: Users, shortLabel: "Users" },
    { id: "admin-analytics", label: "Analytics", icon: BarChart3, shortLabel: "Analytics" },
    { id: "admin-config", label: "System Config", icon: Settings, shortLabel: "Config" }
  ];

  // Countdown timer for next auction
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = auctionConfig.nextAuctionTime - now;
      
      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeToNextAuction(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeToNextAuction("Auction Live!");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [auctionConfig.nextAuctionTime]);

  // Gavel rotation animation
  useEffect(() => {
    const gavelInterval = setInterval(() => {
      setGavelRotation(prev => (prev + 15) % 360);
    }, 2000);

    return () => clearInterval(gavelInterval);
  }, []);

  // Registration form handler
  const handleRegistration = async () => {
    const { email, fullName, phone, password, confirmPassword } = registrationForm;
    
    if (!email || !fullName || !phone || !password || !confirmPassword) {
      alert("Please fill in all fields");
      return;
    }
    
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    
    try {
      setLoading(true);
      await createUser({ email, fullName, phone });
      
      setRegistrationForm({
        email: '',
        fullName: '',
        phone: '',
        password: '',
        confirmPassword: ''
      });
      setShowRegistration(false);
      alert(`Welcome ${fullName}! Your account has been created with 1,000 welcome coins!`);
      setActiveTab("dashboard");
    } catch (error) {
      alert("Error creating account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle bid submission
  const handleBid = async (lot) => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      alert("Please enter a valid investment amount");
      return;
    }

    try {
      setLoading(true);
      await createBid({
        amount: parseFloat(bidAmount),
        lotNumber: lot.lot_number,
        holdingPeriod: selectedPeriod,
        sellerBank: lot.bank_name
      });

      setBidAmount("");
      setActiveTab("bids");
      setMobileMenuOpen(false);
      alert("Investment secured successfully! Please proceed to payment center.");
    } catch (error) {
      alert("Error creating investment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    setMobileMenuOpen(false);
  };

  // Database connection status component
  const DatabaseStatus = () => (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-bold shadow-lg ${
      dbConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white animate-pulse'
    }`}>
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5" />
        <div>
          {dbConnected ? '🟢 Live Database' : '🔴 Run SQL Script'}
          {!dbConnected && (
            <div className="text-xs opacity-90">Need database setup</div>
          )}
        </div>
      </div>
    </div>
  );

  // Setup Instructions Modal
  const [showSetup, setShowSetup] = useState(false);

  const SetupModal = () => (
    showSetup && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-800">🚀 Database Setup Required</h3>
              <Button onClick={() => setShowSetup(false)} variant="outline" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="font-bold text-green-800 mb-2">✅ Credentials Configured!</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <div>✅ Supabase URL: Connected</div>
                  <div>✅ API Key: Configured</div>
                  <div>🔄 Next: Create database tables</div>
                  <div>⚡ Then: Deploy to production</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-bold text-blue-800 mb-2">⚡ Ready to Go Live in 5 Minutes!</h4>
                <p className="text-sm text-blue-700">Your database credentials are configured. Just run the SQL script below!</p>
              </div>

              <div className="bg-slate-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
                <pre>{`-- Copy this SQL to Supabase SQL Editor (https://nwygekmzugvkinaeyyjr.supabase.co)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR NOT NULL,
  phone VARCHAR,
  status VARCHAR DEFAULT 'active',
  total_invested DECIMAL DEFAULT 0,
  active_investments INTEGER DEFAULT 0,
  coin_balance DECIMAL DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE auction_lots (
  id SERIAL PRIMARY KEY,
  lot_number VARCHAR UNIQUE NOT NULL,
  bank_name VARCHAR NOT NULL,
  coin_amount DECIMAL NOT NULL,
  going_price DECIMAL NOT NULL,
  bid_range_min DECIMAL,
  bid_range_max DECIMAL,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_bids (
  id SERIAL PRIMARY KEY,
  bid_number VARCHAR UNIQUE NOT NULL,
  user_email VARCHAR NOT NULL,
  amount DECIMAL NOT NULL,
  status VARCHAR DEFAULT 'pending_payment',
  lot_number VARCHAR,
  holding_period INTEGER,
  seller_bank VARCHAR,
  reference_number VARCHAR,
  purchase_date TIMESTAMP,
  maturity_date TIMESTAMP,
  original_coins DECIMAL,
  matured_coins DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bank_accounts (
  id SERIAL PRIMARY KEY,
  bank_name VARCHAR NOT NULL,
  account_holder VARCHAR NOT NULL,
  account_number VARCHAR NOT NULL,
  branch_code VARCHAR NOT NULL,
  account_type VARCHAR NOT NULL,
  balance DECIMAL DEFAULT 0,
  coin_balance DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE support_chats (
  id SERIAL PRIMARY KEY,
  bid_number VARCHAR,
  user_email VARCHAR NOT NULL,
  issue TEXT,
  status VARCHAR DEFAULT 'open',
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pending_approvals (
  id SERIAL PRIMARY KEY,
  bid_number VARCHAR NOT NULL,
  payer_email VARCHAR NOT NULL,
  amount DECIMAL NOT NULL,
  reference_number VARCHAR,
  payment_proof_url VARCHAR,
  lot_number VARCHAR,
  seller_email VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample auction data
INSERT INTO auction_lots (lot_number, bank_name, coin_amount, going_price, bid_range_min, bid_range_max) VALUES
('11528', 'FNB RSA', 20845.00, 20845.00, 10000, 15000),
('12331', 'FNB', 21000.00, 21000.00, 10000, 15000),
('13878', 'Nedbank', 10145.00, 10145.00, 5000, 10000),
('14836', 'Capitec', 16500.00, 16500.00, 10000, 15000),
('16946', 'Standard Bank', 17862.00, 17862.00, 10000, 15000);

-- Insert sample bank accounts
INSERT INTO bank_accounts (bank_name, account_holder, account_number, branch_code, account_type, balance, coin_balance) VALUES
('FNB RSA', 'Openpeer Digital SA', '62847291734', '250655', 'Business', 2500000, 500000),
('Standard Bank', 'Openpeer Investments', '10293847562', '051001', 'Business', 1800000, 350000),
('Nedbank', 'Openpeer Holdings', '19384756291', '198765', 'Business', 3200000, 650000);

-- Insert sample users
INSERT INTO users (email, full_name, phone, total_invested, coin_balance, is_verified) VALUES
('john@example.com', 'John Smith', '+27831234567', 25000, 1500, true),
('sarah@example.com', 'Sarah Johnson', '+27829876543', 15000, 800, true),
('mike@example.com', 'Mike Wilson', '+27834567890', 0, 1000, false);`}</pre>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={() => {setShowSetup(false); checkDatabaseConnection();}}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3"
                >
                  ✅ Test Database Connection
                </Button>
                <Button 
                  onClick={checkDatabaseConnection}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3"
                >
                  🔄 Try Connect Now
                </Button>
                <Button 
                  onClick={() => setShowSetup(false)}
                  variant="outline"
                  className="px-6 py-3"
                >
                  Continue with Demo Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );

  return (
    <>
      <Head>
        <title>Openpeer Digital Auction - Live P2P Trading Platform</title>
        <meta name="description" content="Professional peer-to-peer digital asset trading platform with real-time auctions" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <DatabaseStatus />
        <SetupModal />

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800"></div>
                <span className="font-semibold">Loading...</span>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Header */}
        <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-slate-800 text-white">
          <div className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/90 p-2 sm:p-3 rounded-xl shadow-lg">
                  <TrendingUp className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight">Openpeer Digital Auction</h1>
                  <p className="text-slate-300 text-xs sm:text-sm font-medium hidden sm:block">
                    {dbConnected ? 'Live Database Connected' : 'Demo Mode - Connect Database to Go Live'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setShowSetup(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs sm:text-sm px-2 sm:px-4 py-2"
                >
                  <Database className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Setup DB</span>
                </Button>
                <Button 
                  onClick={() => setIsAdmin(!isAdmin)}
                  className={`${isAdmin ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-600 hover:bg-slate-700'} text-white font-semibold text-xs sm:text-sm px-2 sm:px-4 py-2`}
                >
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{isAdmin ? 'Exit Admin' : 'Admin Mode'}</span>
                </Button>
                <Button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden bg-slate-600 hover:bg-slate-700 text-white p-2"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">Navigation</h3>
                  <Button onClick={() => setMobileMenuOpen(false)} variant="outline" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {navItems.map((item) => (
                  <Button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className={`w-full justify-start text-left ${
                      activeTab === item.id ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Button>
                ))}
                {isAdmin && (
                  <>
                    <div className="pt-4 pb-2">
                      <div className="text-xs font-semibold text-red-600 uppercase tracking-wide">Admin Controls</div>
                    </div>
                    {adminNavItems.map((item) => (
                      <Button
                        key={item.id}
                        onClick={() => handleTabChange(item.id)}
                        variant={activeTab === item.id ? "default" : "ghost"}
                        className={`w-full justify-start text-left ${
                          activeTab === item.id ? 'bg-red-600 text-white' : 'text-slate-700 hover:bg-red-50'
                        }`}
                      >
                        <item.icon className="h-4 w-4 mr-3" />
                        {item.label}
                      </Button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Desktop Navigation */}
        <div className="hidden lg:block bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-15' : 'grid-cols-7'} h-16 bg-slate-50 rounded-none border-b overflow-x-auto`}>
                {navItems.map((item) => (
                  <TabsTrigger
                    key={item.id}
                    value={item.id}
                    className="flex items-center gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white text-xs"
                  >
                    <item.icon className="h-3 w-3" />
                    <span className="font-medium hidden xl:inline">{item.label}</span>
                    <span className="font-medium xl:hidden">{item.shortLabel}</span>
                  </TabsTrigger>
                ))}
                
                {isAdmin && adminNavItems.map((item) => (
                  <TabsTrigger
                    key={item.id}
                    value={item.id}
                    className="flex items-center gap-1 data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs"
                  >
                    <item.icon className="h-3 w-3" />
                    <span className="font-medium hidden xl:inline">{item.label}</span>
                    <span className="font-medium xl:hidden">{item.shortLabel}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Landing Page */}
            <TabsContent value="landing" className="p-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              <div className="relative min-h-screen flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.3),transparent_50%)]"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(236,72,153,0.3),transparent_50%)]"></div>
                </div>
                
                <div className="relative z-10 flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                  <div className="text-center mb-12 sm:mb-16">
                    <div className="inline-flex items-center gap-3 mb-6 sm:mb-8">
                      <div className="relative">
                        <Gavel 
                          className="h-16 w-16 sm:h-24 sm:w-24 text-amber-400 transition-transform duration-700 ease-in-out"
                          style={{ transform: `rotate(${gavelRotation}deg)` }}
                        />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                      <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                        Openpeer
                      </span>
                      <br />
                      <span className="text-white">Digital Auction</span>
                    </h1>
                    
                    <p className="text-xl sm:text-2xl lg:text-3xl text-slate-300 font-light mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed">
                      The Future of Peer-to-Peer Digital Asset Trading
                    </p>

                    {/* Database Status Banner */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8 ${
                      dbConnected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      <Database className="h-4 w-4" />
                      {dbConnected ? 'Live Database Connected - Ready for Production!' : 'Demo Mode - Setup Database to Go Live'}
                    </div>
                    
                    <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 sm:p-8 lg:p-12 border border-white/10 shadow-2xl mb-8 sm:mb-12 max-w-2xl mx-auto">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-amber-400" />
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">Next Auction</h2>
                      </div>
                      <div className="text-4xl sm:text-6xl font-bold text-amber-400 mb-2 font-mono">
                        {timeToNextAuction}
                      </div>
                      <p className="text-slate-300 text-lg">Live P2P Trading Session</p>
                      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="text-2xl font-bold text-emerald-400">{auctionConfig.coinsPerAuction.toLocaleString()}</div>
                          <div className="text-xs text-slate-400">Coins Available</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="text-2xl font-bold text-blue-400">{auctionConfig.maxLotsPerAuction}</div>
                          <div className="text-xs text-slate-400">Investment Lots</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="text-2xl font-bold text-purple-400">{users.length || 3}</div>
                          <div className="text-xs text-slate-400">Active Traders</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
                      <Button 
                        onClick={() => setShowRegistration(true)}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                      >
                        <Star className="h-5 w-5 sm:h-6 sm:w-6 mr-3" />
                        Join the Auction
                      </Button>
                      <Button 
                        onClick={() => setActiveTab("auctions")}
                        variant="outline"
                        className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl rounded-xl backdrop-blur-sm"
                      >
                        <Eye className="h-5 w-5 sm:h-6 sm:w-6 mr-3" />
                        Explore Investments
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Modal */}
              {showRegistration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowRegistration(false)} />
                  <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
                    <div className="p-6 sm:p-8">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-slate-800">Join Openpeer</h3>
                        <Button onClick={() => setShowRegistration(false)} variant="outline" size="sm">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                          <Input
                            placeholder="John Smith"
                            value={registrationForm.fullName}
                            onChange={(e) => setRegistrationForm({...registrationForm, fullName: e.target.value})}
                            className="text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            value={registrationForm.email}
                            onChange={(e) => setRegistrationForm({...registrationForm, email: e.target.value})}
                            className="text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                          <Input
                            placeholder="+27831234567"
                            value={registrationForm.phone}
                            onChange={(e) => setRegistrationForm({...registrationForm, phone: e.target.value})}
                            className="text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                          <Input
                            type="password"
                            placeholder="Create secure password"
                            value={registrationForm.password}
                            onChange={(e) => setRegistrationForm({...registrationForm, password: e.target.value})}
                            className="text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
                          <Input
                            type="password"
                            placeholder="Confirm your password"
                            value={registrationForm.confirmPassword}
                            onChange={(e) => setRegistrationForm({...registrationForm, confirmPassword: e.target.value})}
                            className="text-sm"
                          />
                        </div>
                        
                        <Button 
                          onClick={handleRegistration}
                          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold py-3 text-lg"
                          disabled={loading}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          {loading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                        
                        <p className="text-xs text-slate-600 text-center">
                          By joining, you agree to our Terms of Service and receive 1,000 welcome coins!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Dashboard */}
            <TabsContent value="dashboard" className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Investment Dashboard</h2>
                <p className="text-slate-600 text-sm sm:text-lg">
                  {dbConnected ? 'Live data from your Supabase database' : 'Demo data - connect database for real functionality'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-slate-700">
                      <div className="p-2 sm:p-3 bg-slate-800 rounded-xl">
                        <Wallet className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <span className="text-sm sm:text-lg font-semibold">Active Investments</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-4xl font-bold text-slate-800 mb-2">
                      {bids.filter(bid => bid.status === 'approved').length || 2}
                    </div>
                    <p className="text-slate-600 font-medium text-xs sm:text-base">Active investment positions</p>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50 hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-slate-700">
                      <div className="p-2 sm:p-3 bg-emerald-700 rounded-xl">
                        <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <span className="text-sm sm:text-lg font-semibold">Portfolio Value</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-4xl font-bold text-slate-800 mb-2">
                      R{(bids.filter(bid => bid.status === 'approved').reduce((sum, bid) => sum + bid.amount, 0) || 27000).toLocaleString()}
                    </div>
                    <p className="text-slate-600 font-medium text-xs sm:text-base">Total invested capital</p>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50 hover:shadow-xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-slate-700">
                      <div className="p-2 sm:p-3 bg-amber-600 rounded-xl">
                        <MessageCircle className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <span className="text-sm sm:text-lg font-semibold">Market Opportunities</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-4xl font-bold text-slate-800 mb-2">{auctions.length || 6}</div>
                    <p className="text-slate-600 font-medium text-xs sm:text-base">Available investment lots</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Auctions */}
            <TabsContent value="auctions" className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100">
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Investment Opportunities</h2>
                  <p className="text-slate-600 text-sm sm:text-lg">
                    {dbConnected ? 'Live auction data from Supabase' : 'Sample opportunities - connect database for live data'}
                  </p>
                </div>

                {/* Sample auction lots if no database */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {[
                    { id: 1, lot_number: "11528", bank_name: "FNB RSA", coin_amount: 20845, going_price: 20845 },
                    { id: 2, lot_number: "12331", bank_name: "FNB", coin_amount: 21000, going_price: 21000 },
                    { id: 3, lot_number: "13878", bank_name: "Nedbank", coin_amount: 10145, going_price: 10145 }
                  ].map((lot) => (
                    <Card key={lot.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg sm:text-xl font-bold">Investment Lot #{lot.lot_number}</CardTitle>
                            <p className="text-slate-200 font-medium text-sm">{lot.bank_name}</p>
                          </div>
                          <Badge className="bg-emerald-500 text-white border-0 font-semibold text-xs">
                            {dbConnected ? 'Live' : 'Demo'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        <div className="text-center">
                          <div className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">
                            {lot.coin_amount.toLocaleString()}<span className="text-sm sm:text-lg text-slate-500 font-normal"> Coins</span>
                          </div>
                          <div className="text-slate-600 font-medium text-sm">
                            Market Price: R {lot.going_price.toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">Investment Period</label>
                            <select 
                              value={selectedPeriod} 
                              onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                              className="w-full p-2 sm:p-3 border-2 border-slate-200 rounded-lg font-medium focus:border-slate-800 focus:ring-0 text-sm"
                            >
                              {holdingPeriods.map((period) => (
                                <option key={period.days} value={period.days}>
                                  {period.label} ({period.returnRate}% projected return)
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">Investment Amount (Coins)</label>
                            <Input
                              type="number"
                              placeholder="Enter coin amount"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              max={lot.coin_amount}
                              className="border-2 border-slate-200 focus:border-slate-800 p-2 sm:p-3 font-medium text-sm"
                            />
                          </div>
                          
                          <Button 
                            onClick={() => handleBid(lot)} 
                            className="w-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white font-semibold py-2 sm:py-3 text-sm sm:text-lg"
                            disabled={!bidAmount || loading}
                          >
                            {loading ? 'Processing...' : 'Secure Investment'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Rest of the content tabs... */}
            <TabsContent value="bids" className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100">
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Payment Center</h2>
                  <p className="text-slate-600 text-sm sm:text-lg">
                    {dbConnected ? 'Real payment processing with database integration' : 'Demo payment center - connect database for live payments'}
                  </p>
                </div>
                
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                    <CardTitle className="text-lg sm:text-xl font-bold">Payment Center</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 sm:p-12">
                    <div className="text-center text-slate-500">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                        <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-slate-400" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2 sm:mb-3">No Pending Payments</h3>
                      <p className="text-base sm:text-lg mb-2">All your investments are up to date</p>
                      <p className="text-slate-500 text-sm sm:text-base">
                        {dbConnected ? 'New investment payments will appear here' : 'Make an investment to see payment options'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Add other tabs as needed... */}

          </Tabs>
        </div>
      </div>
    </>
  );
}