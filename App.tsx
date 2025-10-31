// Counter All Orders Page
const CounterAllOrdersPage: React.FC<{orders: Order[]}> = ({ orders }) => {
    return (
        <div>
            <h1 className="text-4xl font-bold text-white mb-8">All Orders</h1>
            <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-700"><tr><th className="p-3">ID</th><th>Table</th><th>Items</th><th>Total</th><th>Payment</th><th>Staff</th><th>Status</th></tr></thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o.id} className="border-b border-slate-700">
                                <td className="p-3">#{o.id.substring(0, 5)}...</td>
                                <td>{o.table}</td>
                                <td>{o.items.map(i => `${i.name} x${i.quantity}`).join(', ')}</td>
                                <td>GH₵{o.total.toFixed(2)}</td>
                                <td>{o.payment}</td>
                                <td>{o.staffId ? `#${o.staffId.substring(0,5)}${o.staffName ? ` · ${o.staffName}` : ''}` : '-'}</td>
                                <td><span className={`px-2 py-1 text-sm rounded-full ${o.status === 'Served' || o.status === 'Delivered' ? 'bg-green-700' : o.status === 'In Progress' ? 'bg-blue-700' : o.status === 'Ready' ? 'bg-teal-500' : 'bg-yellow-700'}`}>{o.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- SUPER ADMIN APP ---
const SuperAdminApp = () => {
    return (
        <div className="superadmin-wrapper">
            <div className="w-full bg-purple-700 text-white text-center py-2 text-sm">Super Admin</div>
            <AdminApp />
        </div>
    );
};

// Staff Sell Page (shared by Counter and Waiter)
const StaffSellPage: React.FC = () => {
    const db = useDb();
    const { data: menu, loading } = useCollection<MenuItem>('menu');
    const [table, setTable] = React.useState<number | ''>('');
    const [payment, setPayment] = React.useState<'Mobile Money' | 'Cash' | null>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    if (loading) return <div className="text-center">Loading menu...</div>;

    return (
        <CartProvider>
            <div>
                <header className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-white">Sell</h1>
                </header>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {menu.map(item => (
                                <div key={item.id} className="bg-slate-800 rounded-xl overflow-hidden shadow">
                                    <img src={item.img} alt={item.name} className="w-full h-28 object-cover" />
                                    <div className="p-3">
                                        <div className="text-white font-semibold text-sm">{item.name}</div>
                                        <div className="text-amber-400 text-sm">GH₵{item.price.toFixed(2)}</div>
                                        <AddToCartButton item={item} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <StaffCartPanel table={table} setTable={setTable} payment={payment} setPayment={setPayment} onSubmitted={() => navigate(-1)} />
                    </div>
                </div>
            </div>
        </CartProvider>
    );
};

const AddToCartButton: React.FC<{ item: MenuItem }> = ({ item }) => {
    const { addToCart } = useCart();
    return (
        <button onClick={() => addToCart(item)} className="mt-2 w-full bg-amber-500 text-slate-900 text-sm font-semibold py-2 px-3 rounded hover:bg-amber-400">Add</button>
    );
};

const StaffCartPanel: React.FC<{ table: number | ''; setTable: (n: number | '') => void; payment: 'Mobile Money' | 'Cash' | null; setPayment: (p: 'Mobile Money' | 'Cash') => void; onSubmitted: () => void; }> = ({ table, setTable, payment, setPayment, onSubmitted }) => {
    const { cart, totalPrice, updateQuantity, clearCart } = useCart();
    const db = useDb();
    const { data: settings } = useCollection<AppSettings>('settings');
    const { user } = useAuth();
    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState<string | null>(null);

    const taxRate = (settings[0] as any)?.taxRate ?? 0.05;
    const methods = (settings[0] as any)?.paymentMethods ?? { cash: true, mobileMoney: true };
    const tax = totalPrice * taxRate;
    const total = totalPrice + tax;

    const canSubmit = cart.length > 0 && !!table && !!payment;

    const handleSubmit = async () => {
        if (!db || !canSubmit || submitting) return;
        setSubmitError(null);
        setSubmitting(true);
        try {
            const newOrder: Omit<Order, 'id' | 'createdAt'> = {
                table: Number(table),
                items: cart.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
                total,
                payment: payment!,
                status: OrderStatus.Pending,
                staffId: user?.id,
                staffName: user?.name || user?.email,
            };
            await firestoreService.addOrderAndDecrement(db, newOrder);
            clearCart();
            onSubmitted();
        } catch (err) {
            console.error('Failed to submit order', err);
            setSubmitError('Failed to submit order. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-slate-800 rounded-xl p-4 shadow space-y-4">
            <h2 className="text-xl font-semibold text-white">Cart</h2>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                {cart.length === 0 && <div className="text-gray-400 text-sm">No items yet.</div>}
                {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-slate-700/60 p-2 rounded">
                        <div className="text-sm text-white font-medium">{item.name}</div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 bg-slate-600 rounded">-</button>
                            <span className="w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 bg-slate-600 rounded">+</button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="space-y-2">
                <input type="number" min={1} value={table} onChange={e => setTable(e.target.value ? Number(e.target.value) : '')} placeholder="Table #" className="w-full p-2 bg-slate-700 rounded text-sm" />
                <div className="grid grid-cols-2 gap-2">
                    {methods.mobileMoney && (
                        <button onClick={() => setPayment('Mobile Money')} className={`p-2 rounded border text-sm ${payment === 'Mobile Money' ? 'border-amber-500' : 'border-slate-600'} `}>Mobile Money</button>
                    )}
                    {methods.cash && (
                        <button onClick={() => setPayment('Cash')} className={`p-2 rounded border text-sm ${payment === 'Cash' ? 'border-amber-500' : 'border-slate-600'} `}>Cash</button>
                    )}
                </div>
            </div>
            <div className="text-sm text-gray-300 space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>GH₵{totalPrice.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Tax ({Math.round(taxRate * 100)}%)</span><span>GH₵{tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-white text-lg"><span>Total</span><span>GH₵{total.toFixed(2)}</span></div>
            </div>
            {submitError && <div className="text-red-400 text-sm">{submitError}</div>}
            <button disabled={!canSubmit || submitting} onClick={handleSubmit} className="w-full bg-green-600 disabled:bg-slate-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded">
                {submitting ? 'Submitting...' : 'Submit Order'}
            </button>
        </div>
    );
};
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MenuItem, CartItem, Order, Staff, OrderStatus, StaffRole, AppSettings } from './types';
import { Icons, Modal, StatCard } from './components';
import { generateDescription } from './services/geminiService';
import { useCollection } from './hooks/useFirestore';
import * as firestoreService from './services/firestoreService';
import { app } from './firebase'; // Import the initialized app instance
import { FirebaseProvider, useDb } from './context/FirebaseContext';
import { Firestore, getFirestore } from 'firebase/firestore';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/Login';

// --- MAIN APP & INITIALIZATION ---

const App = () => {
    const [db, setDb] = useState<Firestore | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initializeDb = async () => {
            try {
                // Dynamically import the firestore module
                await import('firebase/firestore');
                // Now that the module is loaded, initialize the service
                const firestoreInstance = getFirestore(app);
                setDb(firestoreInstance);
            } catch (err) {
                console.error("Firebase initialization error:", err);
                setError("Failed to connect to the database.");
            } finally {
                setLoading(false);
            }
        };

        initializeDb();
    }, []);

    if (loading) {
        return <div className="flex h-screen items-center justify-center text-xl">Connecting to PubFlow...</div>;
    }
    
    if (error || !db) {
         return <div className="flex h-screen items-center justify-center text-xl text-red-400">{error || "Database could not be initialized."}</div>;
    }

    return (
        <FirebaseProvider db={db}>
            <AuthProvider>
                <HashRouter>
                    <Routes>
                        <Route path="/" element={<AppSelector />} />
                        <Route path="/login/:role" element={<LoginPage />} />
                        <Route path="/customer/*" element={<CustomerApp />} />
                        <Route path="/admin/*" element={<ProtectedRoute role="admin"><AdminApp /></ProtectedRoute>} />
                        <Route path="/superadmin/*" element={<ProtectedRoute role="superadmin"><SuperAdminApp /></ProtectedRoute>} />
                        <Route path="/counter/*" element={<ProtectedRoute role="counter"><CounterApp /></ProtectedRoute>} />
                        <Route path="/waiter/*" element={<ProtectedRoute role="waiter"><WaiterApp /></ProtectedRoute>} />
                    </Routes>
                </HashRouter>
            </AuthProvider>
        </FirebaseProvider>
    );
};

const AppSelector = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-slate-900">
        <h1 className="text-6xl font-bold text-amber-400" style={{ textShadow: '0 0 15px rgba(251, 191, 36, 0.3)' }}>PubFlow</h1>
        <p className="text-xl text-gray-300 mt-4 mb-12">Select your interface</p>
        <div className="w-full max-w-sm space-y-4">
            <Link to="/customer" className="block w-full bg-amber-500 text-slate-900 text-lg font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-amber-400 transition-all duration-300 transform hover:scale-105">Customer View</Link>
            <Link to="/login/waiter" className="block w-full bg-slate-800 text-amber-400 text-lg font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-slate-700 transition-all duration-300 transform hover:scale-105">Waiter View</Link>
            <Link to="/login/counter" className="block w-full bg-slate-800 text-amber-400 text-lg font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-slate-700 transition-all duration-300 transform hover:scale-105">Counter View</Link>
            <Link to="/login/admin" className="block w-full bg-slate-800 text-amber-400 text-lg font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-slate-700 transition-all duration-300 transform hover:scale-105">Admin View</Link>
            <Link to="/login/superadmin" className="block w-full bg-slate-800 text-amber-400 text-lg font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-slate-700 transition-all duration-300 transform hover:scale-105">Super Admin</Link>
        </div>
    </div>
);

// ProtectedRoute to guard staff sections and redirect to login
const ProtectedRoute: React.FC<React.PropsWithChildren<{ role: StaffRole }>> = ({ role, children }) => {
    const { user } = useAuth();
    const location = useLocation();
    if (!user || (user.role !== role && user.role !== 'superadmin')) {
        return <Navigate to={`/login/${role}`} replace state={{ from: location.pathname }} />;
    }
    return <>{children}</>;
};


// --- CONTEXT PROVIDERS ---

// CART CONTEXT
interface CartContextType {
    cart: CartItem[];
    addToCart: (item: MenuItem, quantity?: number) => void;
    updateQuantity: (itemId: string, newQuantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
}
const CartContext = React.createContext<CartContextType | null>(null);
const useCart = () => {
    const context = React.useContext(CartContext);
    if (!context) throw new Error("useCart must be used within a CartProvider");
    return context;
};

const CartProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const [cart, setCart] = React.useState<CartItem[]>([]);

    const addToCart = React.useCallback((item: MenuItem, quantity: number = 1) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(i => i.id === item.id);
            if (existingItem) {
                return prevCart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i);
            }
            return [...prevCart, { ...item, quantity }];
        });
    }, []);
    
    const updateQuantity = React.useCallback((itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            setCart(prevCart => prevCart.filter(i => i.id !== itemId));
        } else {
            setCart(prevCart => prevCart.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i));
        }
    }, []);

    const clearCart = React.useCallback(() => setCart([]), []);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, updateQuantity, clearCart, totalItems, totalPrice }}>
            {children}
        </CartContext.Provider>
    );
};


// --- CUSTOMER APP ---
const CustomerApp = () => {
    const db = useDb();
    const { data: menu, loading } = useCollection<MenuItem>('menu');

    const handleAddOrder = async (newOrder: Omit<Order, 'id' | 'createdAt'>) => {
        if (!db) return;
        await firestoreService.addOrderAndDecrement(db, newOrder);
    };
    
    if (loading) return <div className="flex h-screen items-center justify-center">Loading Menu...</div>;

    return (
        <CartProvider>
            <div className="customer-app relative mx-auto max-w-lg min-h-screen bg-slate-950 shadow-2xl shadow-black/30">
                <Link to="/" className="fixed top-4 left-4 z-[100] bg-slate-800 text-amber-400 p-2 rounded-full shadow-lg hover:bg-slate-700 transition-colors">
                    {Icons.back}
                </Link>
                <Routes>
                    <Route index element={<CustomerLandingPage />} />
                    <Route path="menu" element={<CustomerMenuPage menu={menu} />} />
                    <Route path="checkout" element={<CustomerCheckoutPage onAddOrder={handleAddOrder} />} />
                    <Route path="confirmation" element={<CustomerConfirmationPage />} />
                </Routes>
                <CustomerFloatingCart />
                <CustomerCartModal />
            </div>
        </CartProvider>
    );
};

const CustomerLandingPage = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center h-screen p-8 text-center bg-gradient-to-t from-slate-900 to-slate-800">
            <div className="animate-fade-in-up">
                <h1 className="text-6xl font-bold text-amber-400" style={{ textShadow: '0 0 15px rgba(251, 191, 36, 0.3)' }}>PubFlow</h1>
                <p className="text-xl text-gray-300 mt-4 mb-12">Your Table, Your Drink, Your Way</p>
                <button onClick={() => navigate('menu')} className="w-full bg-amber-500 text-slate-900 text-lg font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-amber-400 transition-all duration-300 transform hover:scale-105">
                    View Menu
                </button>
            </div>
        </div>
    );
};

const CustomerMenuPage: React.FC<{ menu: MenuItem[] }> = ({ menu }) => {
    const { addToCart } = useCart();
    const [query, setQuery] = React.useState<string>('');
    const { data: orders } = useCollection<Order>('orders');

    const q = query.trim().toLowerCase();
    const matchesQuery = (item: MenuItem) =>
        !q || item.name.toLowerCase().includes(q) || (item.description?.toLowerCase().includes(q) ?? false);

    // Compute popularity from orders (sum of quantities per item id)
    const counts = React.useMemo(() => {
        const map = new Map<string, number>();
        orders.forEach(o => {
            o.items.forEach(it => {
                map.set(it.id, (map.get(it.id) || 0) + it.quantity);
            });
        });
        return map;
    }, [orders]);

    const popular = [...menu]
        .filter(matchesQuery)
        .filter(m => (counts.get(m.id) || 0) > 0)
        .sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0))
        .slice(0, 6);

    // Group remaining (or all) by category
    const byCategory = React.useMemo(() => {
        const groups = new Map<string, MenuItem[]>();
        menu.forEach(item => {
            if (!matchesQuery(item)) return;
            const arr = groups.get(item.category) || [];
            arr.push(item);
            groups.set(item.category, arr);
        });
        // Sort items within category by name
        groups.forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name)));
        // Sort categories alphabetically
        return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [menu, q]);

    return (
        <div className="min-h-screen p-6 pb-24">
            <header className="flex items-center justify-between mb-6">
                <h1 className="text-4xl font-bold text-white">Our Menu</h1>
            </header>
            <div className="sticky top-0 bg-slate-950/80 backdrop-blur-sm z-10 py-3 -mx-6 px-6 mb-6">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    type="text"
                    placeholder="Search popular or browse categories..."
                    className="w-full p-2.5 rounded-lg bg-slate-800 text-gray-200 placeholder:text-gray-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
            </div>

            {popular.length > 0 && (
                <section className="mb-6">
                    <h2 className="text-xl font-semibold text-white mb-3">Popular</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {popular.map(item => (
                            <div key={item.id} className="bg-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
                                <img src={item.img} alt={item.name} className="w-full h-32 object-cover" />
                                <div className="p-4 flex flex-col flex-grow">
                                    <h3 className="text-lg font-bold text-white">{item.name}</h3>
                                    <p className="text-md text-amber-400 font-semibold mt-1">GH₵{item.price.toFixed(2)}</p>
                                    <div className="mt-3 flex-grow"></div>
                                    <button onClick={() => addToCart(item)} className="self-end bg-amber-500 text-slate-900 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-amber-400 transition-colors mt-2">
                                        Add
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {byCategory.map(([category, items]) => (
                <section key={category} className="mb-8">
                    <h3 className="text-lg font-semibold text-amber-400 mb-3">{category}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {items.map(item => (
                            <div key={item.id} className="bg-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
                                <img src={item.img} alt={item.name} className="w-full h-32 object-cover" />
                                <div className="p-4 flex flex-col flex-grow">
                                    <h4 className="text-base font-bold text-white">{item.name}</h4>
                                    <p className="text-md text-amber-400 font-semibold mt-1">GH₵{item.price.toFixed(2)}</p>
                                    <div className="mt-3 flex-grow"></div>
                                    <button onClick={() => addToCart(item)} className="self-end bg-amber-500 text-slate-900 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-amber-400 transition-colors mt-2">
                                        Add
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};

const CustomerCheckoutPage: React.FC<{onAddOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;}> = ({ onAddOrder }) => {
    const { cart, totalPrice, clearCart } = useCart();
    const navigate = useNavigate();
    const [payment, setPayment] = React.useState<'Mobile Money' | 'Cash' | null>(null);
    const { data: settings } = useCollection<AppSettings>('settings');
    const taxRate = (settings[0] as any)?.taxRate ?? 0.05;
    const methods = (settings[0] as any)?.paymentMethods ?? { cash: true, mobileMoney: true };
    const tax = totalPrice * taxRate;
    const total = totalPrice + tax;

    React.useEffect(() => {
        if (cart.length === 0) {
            navigate('/customer/menu', { replace: true });
        }
    }, [cart, navigate]);
    
    const handleConfirm = () => {
        const newOrder: Omit<Order, 'id' | 'createdAt'> = {
            table: Math.floor(Math.random() * 20) + 1, // Random table
            items: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
            total: total,
            payment: payment ?? 'Mobile Money',
            status: OrderStatus.Pending,
        };
        onAddOrder(newOrder);
        clearCart();
        navigate('/customer/confirmation');
    };

    return (
        <div className="min-h-screen p-6">
            <header className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-4xl font-bold text-white ml-2">Checkout</h1>
            </header>
            <div>
                <h2 className="text-2xl font-semibold text-amber-400 mb-4">Order Summary</h2>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {cart.map(item => (
                         <div key={item.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-lg">
                            <div>
                                <span className="font-bold text-white">{item.name}</span>
                                <span className="text-gray-400 text-sm"> x {item.quantity}</span>
                            </div>
                            <span className="font-semibold text-gray-200">GH₵{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-700 space-y-2">
                    <div className="flex justify-between text-gray-300"><span>Subtotal</span><span>GH₵{totalPrice.toFixed(2)}</span></div>
                    <div className="flex justify-between text-gray-300"><span>Tax ({Math.round(taxRate * 100)}%)</span><span>GH₵{tax.toFixed(2)}</span></div>
                    <div className="flex justify-between text-white font-bold text-3xl mt-2"><span>Total</span><span>GH₵{total.toFixed(2)}</span></div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-700">
                    <h3 className="text-xl font-semibold text-white mb-3">Select Payment Method</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {methods.mobileMoney && (
                            <button
                                onClick={() => setPayment('Mobile Money')}
                                className={`p-4 rounded-lg border ${payment === 'Mobile Money' ? 'border-amber-500 bg-slate-800' : 'border-slate-700 bg-slate-800/60'} text-left hover:border-amber-400`}
                            >
                                <div className="text-sm text-gray-300">Pay with</div>
                                <div className="text-lg font-bold text-amber-400">Mobile Money (MoMo)</div>
                            </button>
                        )}
                        {methods.cash && (
                            <button
                                onClick={() => setPayment('Cash')}
                                className={`p-4 rounded-lg border ${payment === 'Cash' ? 'border-amber-500 bg-slate-800' : 'border-slate-700 bg-slate-800/60'} text-left hover:border-amber-400`}
                            >
                                <div className="text-sm text-gray-300">Pay with</div>
                                <div className="text-lg font-bold text-amber-400">Cash</div>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-10 pb-6">
                <button onClick={handleConfirm} disabled={!payment} className="w-full bg-green-600 disabled:bg-slate-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-lg font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-green-500 transition-all duration-300">
                    Confirm Order
                </button>
            </div>
        </div>
    );
};

const CustomerConfirmationPage = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center h-screen p-8 text-center">
            <div className="animate-fade-in-up">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg">{Icons.check}</div>
                <h1 className="text-4xl font-bold text-white mt-8">Order Placed!</h1>
                <p className="text-lg text-gray-300 mt-4 mb-12">Your order has been sent to the bar.<br />Estimated time: <strong>5-10 minutes</strong></p>
                <button onClick={() => navigate('/customer/menu')} className="w-full bg-amber-500 text-slate-900 text-lg font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-amber-400 transition-all">
                    Place Another Order
                </button>
            </div>
        </div>
    );
};

const CustomerFloatingCart = () => {
    const { totalItems } = useCart();
    const location = useLocation();
    
    if (!location.pathname.startsWith('/customer/menu')) return null;
    if (totalItems === 0) return null;

    return (
        <button onClick={() => document.getElementById('cart-modal')?.classList.remove('hidden')} className="fixed bottom-6 right-6 z-30 bg-amber-500 text-slate-900 p-4 rounded-full shadow-lg transform transition-transform hover:scale-110">
            {Icons.cart}
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-950">
                {totalItems}
            </span>
        </button>
    );
};

const CustomerCartModal = () => {
    const { cart, totalItems, totalPrice, updateQuantity } = useCart();
    const navigate = useNavigate();
    
    const closeModal = () => {
        document.getElementById('cart-modal')?.classList.add('hidden');
    };
    
    const handleCheckout = () => {
        closeModal();
        navigate('/customer/checkout');
    }

    return (
        <div id="cart-modal" className="hidden fixed inset-0 z-40">
            <div onClick={closeModal} className="absolute inset-0 bg-black/60"></div>
            <div className="absolute top-0 right-0 w-full max-w-md h-full bg-slate-900 shadow-2xl flex flex-col">
                <header className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h2 className="text-3xl font-bold text-white">Your Order</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-800">{Icons.close}</button>
                </header>
                <div className="flex-grow p-6 space-y-4 overflow-y-auto">
                    {totalItems > 0 ? cart.map(item => (
                        <div key={item.id} className="flex items-center bg-slate-800 p-3 rounded-xl shadow">
                            <img src={item.img} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                            <div className="flex-grow ml-4">
                                <h3 className="text-md font-bold text-white">{item.name}</h3>
                                <p className="text-sm text-amber-400">GH₵{item.price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 rounded-full bg-slate-700 hover:bg-slate-600">-</button>
                                <span className="text-md font-bold w-5 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded-full bg-slate-700 hover:bg-slate-600">+</button>
                            </div>
                        </div>
                    )) : <p className="text-center text-gray-400 py-16">Your cart is empty.</p>}
                </div>
                <footer className="p-6 border-t border-slate-700 bg-slate-900">
                    <div className="flex justify-between text-white font-bold text-2xl mb-6">
                        <span>Total</span>
                        <span>GH₵{totalPrice.toFixed(2)}</span>
                    </div>
                    <button onClick={handleCheckout} disabled={totalItems === 0} className="w-full bg-amber-500 text-slate-900 text-lg font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed">
                        Proceed to Checkout
                    </button>
                </footer>
            </div>
        </div>
    );
};


// --- STAFF APPS ---

const StaffLayout: React.FC<React.PropsWithChildren<{ sidebar: React.ReactNode }>> = ({ children, sidebar }) => (
    <div className="flex h-screen staff-app">
        {sidebar}
        <main className="flex-grow h-full overflow-y-auto bg-slate-900">
            <div className="p-8">
                {children}
            </div>
        </main>
    </div>
);

// --- ADMIN APP ---
const AdminApp = () => {
    const { data: orders, loading: ordersLoading } = useCollection<Order>('orders', { field: 'createdAt', direction: 'desc' });
    const { data: menu, loading: menuLoading } = useCollection<MenuItem>('menu');
    const { data: staff, loading: staffLoading } = useCollection<Staff>('staff');

    if (ordersLoading || menuLoading || staffLoading) {
        return <div className="flex h-screen items-center justify-center">Loading Admin Data...</div>
    }

    return (
    <StaffLayout sidebar={<AdminSidebar />}>
        <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage orders={orders} staff={staff} />} />
            <Route path="orders" element={<AdminOrdersPage orders={orders} />} />
            <Route path="menu" element={<AdminMenuPage menu={menu} />} />
            <Route path="sales" element={<AdminSalesPage orders={orders}/>} />
            <Route path="staff" element={<AdminStaffPage staff={staff} />} />
            <Route path="settings" element={<AdminSettingsPage />} />
        </Routes>
    </StaffLayout>
)};

const AdminSidebar = () => {
    const location = useLocation();
    const navItems = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: Icons.dashboard },
        { path: '/admin/orders', label: 'Orders', icon: Icons.orders },
        { path: '/admin/menu', label: 'Menu', icon: Icons.menu },
        { path: '/admin/sales', label: 'Sales', icon: Icons.sales },
        { path: '/admin/staff', label: 'Staff', icon: Icons.staff },
        { path: '/admin/settings', label: 'Settings', icon: Icons.settings },
    ];
    return (
        <nav className="w-64 h-full bg-slate-950 shadow-lg flex-shrink-0 flex flex-col border-r border-slate-800">
            <div className="p-6 text-center">
                <h1 className="text-3xl font-bold text-amber-400" style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.3)' }}>PubFlow</h1>
                <span className="text-sm font-light text-slate-400">Admin Panel</span>
            </div>
            <ul className="flex-grow space-y-2 p-4">
                {navItems.map(item => (
                    <li key={item.path}>
                        <Link to={item.path} className={`sidebar-link flex items-center p-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors ${location.pathname.startsWith(item.path.replace(/\/\*$/, '')) ? 'active' : ''}`}>
                            {item.icon} {item.label}
                        </Link>
                    </li>
                ))}
            </ul>
            <div className="p-4 border-t border-slate-800">
                <Link to="/" className="w-full flex items-center justify-center p-3 rounded-lg text-slate-300 bg-slate-800 hover:bg-red-800/50 hover:text-red-400 transition-colors">
                    Logout
                </Link>
            </div>
        </nav>
    );
};

const AdminDashboardPage: React.FC<{orders: Order[], staff: Staff[]}> = ({ orders, staff }) => {
    const salesData = [ { name: 'Mon', sales: 300 }, { name: 'Tue', sales: 500 }, { name: 'Wed', sales: 450 }, { name: 'Thu', sales: 700 }, { name: 'Fri', sales: 650 }, { name: 'Sat', sales: 800 }, { name: 'Sun', sales: 1250 }];
    const topItemsData = [ { name: 'Club Beer', units: 50 }, { name: 'Guinness', units: 35 }, { name: 'Fries', units: 30 }, { name: 'Mojito', units: 20 }];
    const ongoingOrders = orders.filter(o => o.status === OrderStatus.InProgress || o.status === OrderStatus.Pending).length;
    
    return (
        <div>
            <h1 className="text-4xl font-bold text-white mb-8">Admin Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Sales (Today)" value="GH₵1,250.00" color="amber" />
                <StatCard title="Total Orders (Today)" value={orders.length} color="blue" />
                <StatCard title="Ongoing Orders" value={ongoingOrders} color="green" />
                <StatCard title="Total Staff" value={staff.length} color="purple" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-white mb-4">Weekly Sales</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesData}><CartesianGrid strokeDasharray="3 3" stroke="#475569" /><XAxis dataKey="name" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }}/><Legend /><Line type="monotone" dataKey="sales" stroke="#f59e0b" strokeWidth={2} /></LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-white mb-4">Top-Selling Drinks</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topItemsData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#475569" /><XAxis type="number" stroke="#94a3b8" /><YAxis type="category" dataKey="name" stroke="#94a3b8" width={80} /><Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }}/><Bar dataKey="units" fill="#f59e0b" /></BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const AdminOrdersPage: React.FC<{orders: Order[]}> = ({ orders }) => (
    <div>
        <h1 className="text-4xl font-bold text-white mb-8">Orders Management</h1>
        <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-700"><tr><th className="p-3">ID</th><th>Table</th><th>Items</th><th>Total</th><th>Payment</th><th>Staff</th><th>Status</th></tr></thead>
                <tbody>
                    {orders.map(o => (
                        <tr key={o.id} className="border-b border-slate-700">
                            <td className="p-3">#{o.id.substring(0, 5)}...</td><td>{o.table}</td><td>{o.items.map(i => `${i.name} x${i.quantity}`).join(', ')}</td><td>GH₵{o.total.toFixed(2)}</td><td>{o.payment}</td><td>{o.staffId ? `#${o.staffId.substring(0,5)}${o.staffName ? ` · ${o.staffName}` : ''}` : '-'}</td><td><span className={`px-2 py-1 text-sm rounded-full ${o.status === 'Served' || o.status === 'Delivered' ? 'bg-green-700' : o.status === 'In Progress' ? 'bg-blue-700' : o.status === 'Ready' ? 'bg-teal-500' : 'bg-yellow-700'}`}>{o.status}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const AdminMenuPage: React.FC<{menu: MenuItem[]}> = ({ menu }) => {
    const db = useDb();
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [newItemName, setNewItemName] = React.useState("");
    const [newItemPrice, setNewItemPrice] = React.useState("");
    const [newItemCategory, setNewItemCategory] = React.useState("Soft Drinks");
    const [newItemDescription, setNewItemDescription] = React.useState("");
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [isSeeding, setIsSeeding] = React.useState(false);
    const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
    const [newItemStock, setNewItemStock] = React.useState<string>("");

    const handleGenerateDesc = async () => {
        if (!newItemName) return;
        setIsGenerating(true);
        const desc = await generateDescription(newItemName);
        setNewItemDescription(desc);
        setIsGenerating(false);
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db) return;
        const price = parseFloat(newItemPrice);
        if (!newItemName || isNaN(price) || !newItemCategory) return;
        if (editingItemId) {
            await firestoreService.updateMenuItem(db, editingItemId, {
                name: newItemName,
                price,
                category: newItemCategory,
                img: `https://placehold.co/150x150/1e293b/f59e0b?text=${newItemName.substring(0,6)}`,
                description: newItemDescription,
                stock: newItemStock === '' ? undefined : Number(newItemStock),
            });
        } else {
            await firestoreService.addMenuItem(db, {
                name: newItemName,
                price,
                category: newItemCategory,
                img: `https://placehold.co/150x150/1e293b/f59e0b?text=${newItemName.substring(0,6)}`,
                description: newItemDescription,
                stock: newItemStock === '' ? undefined : Number(newItemStock),
            });
        }

        // Reset form and close
        setEditingItemId(null);
        setNewItemName('');
        setNewItemPrice('');
        setNewItemCategory('Soft Drinks');
        setNewItemDescription('');
        setNewItemStock('');
        setIsModalOpen(false);
    }

    const handleDeleteItem = async (itemId: string) => {
        if (db && window.confirm("Are you sure you want to delete this item?")) {
            await firestoreService.deleteMenuItem(db, itemId);
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-white">Menu Management</h1>
                <div className="flex items-center gap-3">
                    <button onClick={async () => { if (!db) return; setIsSeeding(true); await firestoreService.seedMenuItems(db); setIsSeeding(false); }} disabled={isSeeding} className="bg-slate-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-600 disabled:opacity-50">
                        {isSeeding ? 'Seeding...' : 'Seed Sample Menu'}
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors">Add New Item</button>
                </div>
            </div>
            <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-700"><tr><th className="p-3"></th><th>Name</th><th>Price</th><th>Stock</th><th>Category</th><th>Actions</th></tr></thead>
                    <tbody>
                        {menu.map(i => (
                            <tr key={i.id} className="border-b border-slate-700">
                                <td className="p-3"><img src={i.img} alt={i.name} className="w-10 h-10 rounded object-cover" /></td><td>{i.name}</td><td>GH₵{i.price.toFixed(2)}</td><td>{typeof i.stock === 'number' ? i.stock : '-'}</td><td>{i.category}</td><td className="space-x-3"><button className="text-blue-400 hover:text-blue-300" onClick={() => { setEditingItemId(i.id); setNewItemName(i.name); setNewItemPrice(String(i.price)); setNewItemCategory(i.category); setNewItemDescription(i.description || ''); setNewItemStock(typeof i.stock === 'number' ? String(i.stock) : ''); setIsModalOpen(true); }}>Edit</button><button className="text-red-400 hover:text-red-300" onClick={() => handleDeleteItem(i.id)}>Delete</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItemId(null); }} title={editingItemId ? "Edit Menu Item" : "Add New Menu Item"}>
                <form className="space-y-4" onSubmit={handleAddItem}>
                    <input type="text" placeholder="Item Name" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full p-3 bg-slate-700 rounded-lg" required/>
                    <input type="number" step="0.01" placeholder="Price" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} className="w-full p-3 bg-slate-700 rounded-lg" required/>
                    <input type="number" step="1" min="0" placeholder="Stock (optional)" value={newItemStock} onChange={e => setNewItemStock(e.target.value)} className="w-full p-3 bg-slate-700 rounded-lg" />
                    <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} className="w-full p-3 bg-slate-700 rounded-lg"><option>Soft Drinks</option><option>Alcoholic Drinks</option><option>Cocktails 🍸</option><option>Snacks/Food 🍕</option></select>
                     <div className="relative">
                        <textarea rows={3} placeholder="Description" value={newItemDescription} onChange={e => setNewItemDescription(e.target.value)} className="w-full p-3 bg-slate-700 rounded-lg" />
                        <button type="button" onClick={handleGenerateDesc} disabled={isGenerating || !newItemName} className="absolute bottom-2 right-2 flex items-center bg-purple-600 text-white text-xs font-semibold py-1 px-2 rounded-full hover:bg-purple-500 disabled:bg-slate-500 disabled:cursor-not-allowed">
                            {Icons.sparkles} {isGenerating ? 'Generating...' : 'AI Generate'}
                        </button>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={() => { setIsModalOpen(false); setEditingItemId(null); }} className="bg-slate-600 text-gray-200 py-2 px-5 rounded-lg">Cancel</button>
                        <button type="submit" className="bg-amber-500 text-slate-900 py-2 px-5 rounded-lg font-bold">{editingItemId ? 'Update' : 'Save'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const AdminStaffPage: React.FC<{staff: Staff[]}> = ({ staff }) => {
    const db = useDb();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingStaffId, setEditingStaffId] = React.useState<string | null>(null);
    const [staffName, setStaffName] = React.useState<string>("");
    const [staffEmail, setStaffEmail] = React.useState<string>("");
    const [staffRole, setStaffRole] = React.useState<StaffRole>('waiter');
    const [busyId, setBusyId] = React.useState<string | null>(null);
    
    const handleSaveStaff = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!db) return;
        const name = staffName.trim();
        const email = staffEmail.trim().toLowerCase();
        const role = staffRole;

        if (!name || !email || !role) return;

        if (editingStaffId) {
            await firestoreService.updateStaff(db, editingStaffId, { name, email, role });
        } else {
            await firestoreService.addStaff(db, { name, email, role });
        }
        setIsModalOpen(false);
        setEditingStaffId(null);
        setStaffName("");
        setStaffEmail("");
        setStaffRole('waiter');
    };

    const visibleStaff = React.useMemo(() => {
        if (user?.role === 'admin') {
            return staff.filter(s => s.role !== 'superadmin');
        }
        return staff;
    }, [staff, user?.role]);

    return(
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-white">Staff Management</h1>
                <button onClick={() => { setEditingStaffId(null); setStaffName(''); setStaffEmail(''); setStaffRole('waiter'); setIsModalOpen(true); }} className="bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400">Add New Staff</button>
            </div>
             <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-700"><tr><th className="p-3">Name</th><th>Role</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {visibleStaff.map(s => (
                            <tr key={s.id} className="border-b border-slate-700">
                                <td className="p-3">{s.name}</td>
                                <td className="capitalize">{s.role}</td>
                                <td>{s.email}</td>
                                <td>
                                    <span className={`px-2 py-1 text-xs rounded-full ${s.active === false ? 'bg-red-700 text-white' : 'bg-green-700 text-white'}`}>{s.active === false ? 'Suspended' : 'Active'}</span>
                                </td>
                                <td className="space-x-3">
                                    <button className="text-blue-400 hover:text-blue-300" onClick={() => { setEditingStaffId(s.id); setStaffName(s.name); setStaffEmail(s.email); setStaffRole(s.role); setIsModalOpen(true); }}>Edit</button>
                                    <button disabled={busyId === s.id} className="text-yellow-400 hover:text-yellow-300 disabled:opacity-50" onClick={async () => { if (!db) return; setBusyId(s.id); await firestoreService.updateStaff(db, s.id, { active: s.active === false }); setBusyId(null); }}>{s.active === false ? 'Activate' : 'Suspend'}</button>
                                    <button disabled={busyId === s.id} className="text-red-400 hover:text-red-300 disabled:opacity-50" onClick={async () => { if (!db) return; if (!window.confirm('Delete this staff? This cannot be undone.')) return; setBusyId(s.id); await firestoreService.deleteStaff(db, s.id); setBusyId(null); }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingStaffId(null); }} title={editingStaffId ? "Edit Staff" : "Add Staff"}>
                 <form className="space-y-4" onSubmit={handleSaveStaff}>
                    <input value={staffName} onChange={(e) => setStaffName(e.target.value)} type="text" placeholder="Full Name" className="w-full p-3 bg-slate-700 rounded-lg" required/>
                    <input value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} type="email" placeholder="Email" className="w-full p-3 bg-slate-700 rounded-lg" required/>
                    <select value={staffRole} onChange={(e) => setStaffRole(e.target.value as StaffRole)} className="w-full p-3 bg-slate-700 rounded-lg" required>
                        <option value="waiter">Waiter</option>
                        <option value="counter">Counter</option>
                        <option value="admin">Admin</option>
                        {user?.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
                    </select>
                    <div className="flex justify-end space-x-4 pt-4"><button type="button" onClick={() => { setIsModalOpen(false); setEditingStaffId(null); }} className="bg-slate-600 text-gray-200 py-2 px-5 rounded-lg">Cancel</button><button type="submit" className="bg-amber-500 text-slate-900 py-2 px-5 rounded-lg font-bold">{editingStaffId ? 'Update' : 'Save'}</button></div>
                </form>
            </Modal>
        </div>
    );
}

const AdminSalesPage: React.FC<{orders: Order[]}> = ({ orders }) => {
    const paymentData = orders.reduce((acc, order) => {
        const existing = acc.find(item => item.name === order.payment);
        if (existing) {
            existing.value += 1;
        } else {
            acc.push({ name: order.payment, value: 1 });
        }
        return acc;
    }, [] as {name: string, value: number}[]);
    
    const COLORS = ['#0ea5e9', '#f59e0b', '#10b981'];
     return (
        <div>
            <h1 className="text-4xl font-bold text-white mb-8">Sales Reports</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold text-white mb-4">Payment Breakdown</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {paymentData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }}/>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const AdminSettingsPage = () => {
    const db = useDb();
    const { data: settings, loading } = useCollection<AppSettings>('settings');
    const existing = (settings as any[])[0];
    const [taxRate, setTaxRate] = React.useState<number>(0.05);
    const [cash, setCash] = React.useState<boolean>(true);
    const [mobileMoney, setMobileMoney] = React.useState<boolean>(true);
    const [saving, setSaving] = React.useState<boolean>(false);

    React.useEffect(() => {
        if (existing) {
            setTaxRate(typeof existing.taxRate === 'number' ? existing.taxRate : 0.05);
            setCash(!!existing?.paymentMethods?.cash);
            setMobileMoney(!!existing?.paymentMethods?.mobileMoney);
        }
    }, [existing]);

    const handleSave = async () => {
        if (!db) return;
        setSaving(true);
        await firestoreService.upsertSettings(
            db,
            existing?.id ?? null,
            {
                taxRate: Math.max(0, Math.min(1, Number(taxRate) || 0)),
                paymentMethods: { cash, mobileMoney },
            }
        );
        setSaving(false);
    };

    return (
        <div>
            <h1 className="text-4xl font-bold text-white mb-8">Settings</h1>
            {loading ? (
                <div className="text-gray-300">Loading settings...</div>
            ) : (
                <div className="space-y-8 max-w-xl">
                    <section className="bg-slate-800 p-6 rounded-xl shadow">
                        <h2 className="text-xl font-semibold text-white mb-4">Tax & Charges</h2>
                        <label className="block text-sm text-gray-300 mb-2">Tax Rate (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            min={0}
                            max={100}
                            value={(taxRate * 100).toString()}
                            onChange={(e) => setTaxRate((Number(e.target.value) || 0) / 100)}
                            className="w-full p-3 bg-slate-700 rounded-lg"
                        />
                        <p className="text-xs text-gray-400 mt-2">Applied at checkout and staff cart.</p>
                    </section>

                    <section className="bg-slate-800 p-6 rounded-xl shadow">
                        <h2 className="text-xl font-semibold text-white mb-4">Payment Methods</h2>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-300">Cash</span>
                            <input type="checkbox" checked={cash} onChange={(e) => setCash(e.target.checked)} />
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-300">Mobile Money (MoMo)</span>
                            <input type="checkbox" checked={mobileMoney} onChange={(e) => setMobileMoney(e.target.checked)} />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Controls which payment options are shown to customers and staff.</p>
                    </section>

                    <div className="pt-2">
                        <button onClick={handleSave} disabled={saving} className="bg-amber-500 text-slate-900 font-bold py-2 px-5 rounded-lg hover:bg-amber-400 disabled:opacity-50">
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- COUNTER APP ---
const CounterApp = () => {
    const { data: orders, loading } = useCollection<Order>('orders', { field: 'createdAt', direction: 'desc' });
    if (loading) return <div className="flex h-screen items-center justify-center">Loading Orders...</div>;

    return (
        <StaffLayout sidebar={<CounterSidebar />}>
            <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<CounterDashboardPage orders={orders} />} />
                <Route path="active" element={<CounterActiveOrdersPage orders={orders} />} />
                <Route path="completed" element={<CounterCompletedOrdersPage orders={orders} />} />
                <Route path="all" element={<CounterAllOrdersPage orders={orders} />} />
                <Route path="sell" element={<StaffSellPage />} />
            </Routes>
        </StaffLayout>
    );
};

const CounterSidebar = () => {
    const location = useLocation();
    const navItems = [
        { path: '/counter/dashboard', label: 'Dashboard', icon: Icons.dashboard },
        { path: '/counter/active', label: 'Active Orders', icon: Icons.orders },
        { path: '/counter/completed', label: 'Completed', icon: Icons.check },
        { path: '/counter/all', label: 'All Orders', icon: Icons.menu },
        { path: '/counter/sell', label: 'Sell', icon: Icons.cart },
    ];
    return (
         <nav className="w-64 h-full bg-slate-950 shadow-lg flex-shrink-0 flex flex-col border-r border-slate-800">
            <div className="p-6 text-center">
                <h1 className="text-3xl font-bold text-amber-400" style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.3)' }}>PubFlow</h1>
                <span className="text-sm font-light text-slate-400">Counter Panel</span>
            </div>
            <ul className="flex-grow space-y-2 p-4">
                 {navItems.map(item => (
                    <li key={item.path}><Link to={item.path} className={`sidebar-link flex items-center p-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors ${location.pathname.startsWith(item.path) ? 'active' : ''}`}>{item.icon} {item.label}</Link></li>
                ))}
            </ul>
             <div className="p-4 border-t border-slate-800"><Link to="/" className="w-full flex items-center justify-center p-3 rounded-lg text-slate-300 bg-slate-800 hover:bg-red-800/50 hover:text-red-400 transition-colors">Logout</Link></div>
        </nav>
    );
};

const CounterDashboardPage: React.FC<{orders: Order[]}> = ({ orders }) => {
    const activeOrders = orders.filter(o => o.status === OrderStatus.Pending || o.status === OrderStatus.InProgress).length;
    const readyOrders = orders.filter(o => o.status === OrderStatus.Ready).length;
    const completedOrders = orders.filter(o => o.status === OrderStatus.Served || o.status === OrderStatus.Delivered).length;
    return (
        <div>
            <h1 className="text-4xl font-bold text-white mb-8">Counter Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-800 p-8 rounded-xl shadow-lg text-center"><h3 className="text-xl font-medium text-gray-400 uppercase">Active Orders</h3><p className="text-6xl font-bold text-yellow-400 mt-4">{activeOrders}</p></div>
                <div className="bg-slate-800 p-8 rounded-xl shadow-lg text-center"><h3 className="text-xl font-medium text-gray-400 uppercase">Ready to Serve</h3><p className="text-6xl font-bold text-green-400 mt-4">{readyOrders}</p></div>
                <div className="bg-slate-800 p-8 rounded-xl shadow-lg text-center"><h3 className="text-xl font-medium text-gray-400 uppercase">Completed Today</h3><p className="text-6xl font-bold text-gray-500 mt-4">{completedOrders}</p></div>
            </div>
        </div>
    );
};

const CounterActiveOrdersPage: React.FC<{orders: Order[]}> = ({ orders }) => {
    const db = useDb();
    const activeOrders = orders.filter(o => o.status === OrderStatus.Pending || o.status === OrderStatus.InProgress || o.status === OrderStatus.Ready);
    
    const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
        if (db) {
            firestoreService.updateOrderStatus(db, orderId, newStatus);
        }
    };
    
    const getNextAction = (status: OrderStatus): { label: string, newStatus: OrderStatus, className: string } | null => {
        if (status === OrderStatus.Pending) return { label: "Start Order", newStatus: OrderStatus.InProgress, className: "bg-blue-600 hover:bg-blue-500" };
        if (status === OrderStatus.InProgress) return { label: "Mark as Ready", newStatus: OrderStatus.Ready, className: "bg-green-600 hover:bg-green-500" };
        if (status === OrderStatus.Ready) return { label: "Mark as Served", newStatus: OrderStatus.Served, className: "bg-gray-500 hover:bg-gray-400" };
        return null;
    }

    return (
        <div>
            <h1 className="text-4xl font-bold text-white mb-8">Active Orders</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {activeOrders.map(order => {
                    const action = getNextAction(order.status);
                    return (
                        <div key={order.id} className="bg-slate-800 rounded-xl shadow-lg p-5 flex flex-col">
                            <div className="flex-grow">
                                <div className="flex justify-between items-center mb-3"><span className="text-2xl font-bold text-white">Table {order.table}</span><span className="text-sm text-gray-400">#{order.id.substring(0,5)}</span></div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${order.status === 'Pending' ? 'bg-yellow-700' : order.status === 'In Progress' ? 'bg-blue-700' : 'bg-green-700'}`}>{order.status}</span>
                                    <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-700 text-amber-400">{order.payment}</span>
                                </div>
                                <ul className="my-4 space-y-2 text-lg divide-y divide-slate-700">{order.items.map(i => <li key={i.id} className="flex justify-between pt-2"><span className="font-semibold">{i.name}</span><span className="text-gray-400">x {i.quantity}</span></li>)}</ul>
                            </div>
                             {action && <button onClick={() => handleUpdateStatus(order.id, action.newStatus)} className={`w-full text-white font-bold py-3 rounded-lg transition-colors ${action.className}`}>{action.label}</button>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const CounterCompletedOrdersPage: React.FC<{orders: Order[]}> = ({ orders }) => {
    const completedOrders = orders.filter(o => o.status === OrderStatus.Served || o.status === OrderStatus.Delivered);
    return (
        <div>
            <h1 className="text-4xl font-bold text-white mb-8">Completed Orders</h1>
             <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-700"><tr><th className="p-3">ID</th><th>Table</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
                    <tbody>
                        {completedOrders.map(o => (
                            <tr key={o.id} className="border-b border-slate-700">
                                <td className="p-3">#{o.id.substring(0, 5)}...</td><td>{o.table}</td><td>{o.items.map(i => `${i.name} x${i.quantity}`).join(', ')}</td><td>${o.total.toFixed(2)}</td><td>{o.payment}</td><td><span className="px-2 py-1 text-sm rounded-full bg-gray-700">{o.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- WAITER APP ---
const WaiterApp = () => {
    const { data: orders, loading } = useCollection<Order>('orders', { field: 'createdAt', direction: 'desc' });
    if (loading) return <div className="flex h-screen items-center justify-center">Loading Orders...</div>;

    return (
        <div className="waiter-app h-screen flex flex-col">
            <main className="flex-grow overflow-y-auto pb-24 p-4 sm:p-6">
                 <Routes>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<WaiterDashboardPage orders={orders} />} />
                    <Route path="active" element={<WaiterActiveOrdersPage orders={orders} />} />
                    <Route path="completed" element={<WaiterCompletedOrdersPage orders={orders} />} />
                    <Route path="profile" element={<WaiterProfilePage />} />
                    <Route path="sell" element={<StaffSellPage />} />
                </Routes>
            </main>
            <WaiterBottomNav />
        </div>
    );
};

const WaiterBottomNav = () => {
    const location = useLocation();
    const navItems = [
        { path: '/waiter/dashboard', label: 'Home', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6-4a1 1 0 001-1v-1a1 1 0 10-2 0v1a1 1 0 001 1z" /></svg> },
        { path: '/waiter/active', label: 'Orders', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0l4-4m0 4l4 4" /></svg> },
        { path: '/waiter/completed', label: 'Completed', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { path: '/waiter/profile', label: 'Profile', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
        { path: '/waiter/sell', label: 'Sell', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zM7 18a2 2 0 100 4 2 2 0 000-4z" /></svg> },
    ];
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-slate-950 border-t border-slate-800 shadow-lg grid grid-cols-4 items-center z-50">
            {navItems.map(item => (
                <Link key={item.path} to={item.path} className={`waiter-nav-link flex flex-col items-center justify-center transition-colors text-gray-400 hover:text-amber-400 ${location.pathname.startsWith(item.path) ? 'active' : ''}`}>
                    {item.icon}
                    <span className="text-xs font-medium mt-1">{item.label}</span>
                </Link>
            ))}
        </nav>
    )
}

const WaiterDashboardPage: React.FC<{orders: Order[]}> = ({ orders }) => {
    const navigate = useNavigate();
    const pendingDeliveries = orders.filter(o => o.status === OrderStatus.Ready).length;
    const deliveredToday = orders.filter(o => o.status === OrderStatus.Delivered).length;

    return (
         <div>
            <header className="mb-6"><h1 className="text-3xl font-bold text-white">Welcome, Waiter!</h1><p className="text-lg text-gray-400">Here's your summary.</p></header>
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-800 p-4 rounded-xl shadow-lg border-l-4 border-amber-500 text-center"><h3 className="text-sm font-medium text-gray-400 uppercase">Pending Deliveries</h3><p className="text-4xl font-bold text-white mt-2">{pendingDeliveries}</p></div>
                <div className="bg-slate-800 p-4 rounded-xl shadow-lg border-l-4 border-green-500 text-center"><h3 className="text-sm font-medium text-gray-400 uppercase">Delivered Today</h3><p className="text-4xl font-bold text-white mt-2">{deliveredToday}</p></div>
            </div>
             <div className="space-y-4">
                <button onClick={() => navigate('/waiter/active')} className="w-full text-left flex items-center bg-amber-500 text-slate-900 text-lg font-bold py-5 px-6 rounded-xl shadow-lg hover:bg-amber-400 transition-all transform hover:scale-105">View Active Orders</button>
            </div>
        </div>
    );
};

const WaiterActiveOrdersPage: React.FC<{orders: Order[]}> = ({ orders }) => {
    const db = useDb();
    const readyOrders = orders.filter(o => o.status === OrderStatus.Ready);

    const handleDeliver = (orderId: string) => {
        if(db) firestoreService.updateOrderStatus(db, orderId, OrderStatus.Delivered);
    }
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Orders to Deliver</h1>
            <div className="space-y-4">
                {readyOrders.length > 0 ? readyOrders.map(order => (
                    <div key={order.id} className="bg-slate-800 rounded-xl shadow-lg border-l-4 border-green-500 p-4">
                        <div className="flex justify-between items-center mb-2"><span className="text-2xl font-bold text-white">Table {order.table}</span><span className="text-xs text-gray-400">#{order.id.substring(0,5)}</span></div>
                        <div className="mb-2"><span className="text-xs font-semibold px-2 py-1 rounded bg-slate-700 text-amber-400">{order.payment}{order.payment === 'Cash' ? ' • Collect Cash' : ''}</span></div>
                        <ul className="my-3 space-y-1 divide-y divide-slate-700/50">{order.items.map(i => <li key={i.id} className="flex justify-between text-gray-300 pt-1"><span>{i.name}</span><span className="font-medium">x {i.quantity}</span></li>)}</ul>
                        <button onClick={() => handleDeliver(order.id)} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-500 transition-colors mt-3 text-lg">Mark as Delivered</button>
                    </div>
                )) : <p className="text-gray-400 text-lg text-center">No orders ready for delivery.</p>}
            </div>
        </div>
    );
};

const WaiterCompletedOrdersPage: React.FC<{orders: Order[]}> = ({ orders }) => {
    const deliveredOrders = orders.filter(o => o.status === OrderStatus.Delivered);
    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Completed Deliveries</h1>
            <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <table className="w-full text-left text-sm sm:text-base">
                    <thead><tr><th className="p-3">ID</th><th className="p-3">Table</th><th className="p-3">Total</th><th className="p-3">Payment</th></tr></thead>
                    <tbody className="divide-y divide-slate-700">
                         {deliveredOrders.map(o => (
                            <tr key={o.id} className="opacity-70">
                                <td className="p-3 font-medium">#{o.id.substring(0,5)}</td>
                                <td className="p-3">Table {o.table}</td>
                                <td className="p-3">${o.total.toFixed(2)}</td>
                                <td className="p-3">{o.payment}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const WaiterProfilePage = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Profile</h1>
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg space-y-4">
                <div><label className="text-sm font-medium text-gray-400">Name</label><p className="text-lg text-white font-semibold">Waiter</p></div>
                <button className="w-full mt-6 bg-slate-700 text-gray-200 py-3 px-4 rounded-lg font-semibold hover:bg-slate-600">Change Password</button>
                <button onClick={() => { logout(); navigate('/'); }} className="w-full mt-2 bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-500">Logout</button>
            </div>
        </div>
    );
};

export default App;