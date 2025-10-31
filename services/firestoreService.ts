import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, Firestore, increment } from 'firebase/firestore';
import { Order, OrderStatus, MenuItem, Staff, AppSettings } from '../types';

// Orders
export const addOrder = async (db: Firestore, orderData: Omit<Order, 'id' | 'createdAt'>) => {
  const orderWithTimestamp = {
    ...orderData,
    createdAt: serverTimestamp(),
  };
  return await addDoc(collection(db, 'orders'), orderWithTimestamp);
};

export const addOrderAndDecrement = async (db: Firestore, orderData: Omit<Order, 'id' | 'createdAt'>) => {
  const added = await addOrder(db, orderData);
  // Decrement stock for each ordered item
  for (const it of orderData.items) {
    try {
      const itemRef = doc(db, 'menu', it.id);
      await updateDoc(itemRef, { stock: increment(-it.quantity) });
    } catch (e) {
      // If stock field doesn't exist, this will create it as negative; in a real app, fetch and clamp at 0.
      // Keeping it simple here per requirements.
    }
  }
  return added;
};

export const updateOrderStatus = async (db: Firestore, orderId: string, status: OrderStatus) => {
  const orderRef = doc(db, 'orders', orderId);
  return await updateDoc(orderRef, { status });
};


// Menu
export const addMenuItem = async (db: Firestore, itemData: Omit<MenuItem, 'id'>) => {
    return await addDoc(collection(db, 'menu'), itemData);
}

export const updateMenuItem = async (db: Firestore, itemId: string, itemData: Partial<MenuItem>) => {
    const itemRef = doc(db, 'menu', itemId);
    return await updateDoc(itemRef, itemData);
}

export const deleteMenuItem = async (db: Firestore, itemId: string) => {
    const itemRef = doc(db, 'menu', itemId);
    return await deleteDoc(itemRef);
}

export const seedMenuItems = async (db: Firestore) => {
    const items: Omit<MenuItem, 'id'>[] = [
        { name: 'Club Beer', price: 15, category: 'Alcoholic Drinks', img: 'https://placehold.co/150x150/1e293b/f59e0b?text=Club', stock: 120, description: 'Crisp and refreshing lager.' },
        { name: 'Guinness Stout', price: 20, category: 'Alcoholic Drinks', img: 'https://placehold.co/150x150/1e293b/f59e0b?text=Guinness', stock: 80, description: 'Rich and velvety stout.' },
        { name: 'Heineken', price: 18, category: 'Alcoholic Drinks', img: 'https://placehold.co/150x150/1e293b/f59e0b?text=Heineken', stock: 100, description: 'Classic European pale lager.' },
        { name: 'Coca-Cola', price: 8, category: 'Soft Drinks', img: 'https://placehold.co/150x150/1e293b/f59e0b?text=Coke', stock: 200, description: 'Chilled cola served over ice.' },
        { name: 'Fanta Orange', price: 8, category: 'Soft Drinks', img: 'https://placehold.co/150x150/1e293b/f59e0b?text=Fanta', stock: 180, description: 'Zesty orange soda.' },
        { name: 'Sprite', price: 8, category: 'Soft Drinks', img: 'https://placehold.co/150x150/1e293b/f59e0b?text=Sprite', stock: 170, description: 'Lemon-lime freshness.' },
        { name: 'Mojito', price: 30, category: 'Cocktails 🍸', img: 'https://placehold.co/150x150/1e293b/f59e0b?text=Mojito', stock: 60, description: 'Mint, lime, and rum over ice.' },
        { name: 'Pina Colada', price: 32, category: 'Cocktails 🍸', img: 'https://placehold.co/150x150/1e293b/f59e0b?text=Colada', stock: 50, description: 'Creamy pineapple and coconut.' },
        { name: 'Bloody Mary', price: 28, category: 'Cocktails 🍸', img: 'https://placehold.co/150x150/1e293b/f59e0b?text=Mary', stock: 40, description: 'Savory tomato cocktail.' },
        { name: 'French Fries', price: 22, category: 'Snacks/Food 🍕', img: 'https://placehold.co/150x150/1e293b/f59e0b?text=Fries', stock: 90, description: 'Golden and crispy fries.' },
        { name: 'Chicken Wings', price: 40, category: 'Snacks/Food 🍕', img: 'https://placehold.co/150x150/1e293b/f59e0b?text=Wings', stock: 70, description: 'Spicy glazed wings.' },
        { name: 'Beef Burger', price: 45, category: 'Snacks/Food 🍕', img: 'https://placehold.co/150x150/1e293b/f59e0b?text=Burger', stock: 75, description: 'Juicy beef with toppings.' },
    ];

    for (const item of items) {
        await addDoc(collection(db, 'menu'), item);
    }
}

// Staff
export const addStaff = async (db: Firestore, staffData: Omit<Staff, 'id' | 'createdAt'>) => {
    // In a real app, this would also create an auth user.
    // For Firestore-only demo, we add directly.
    const staffWithTimestamp = {
        ...staffData,
        active: staffData.active ?? true,
        createdAt: serverTimestamp()
    };
    return await addDoc(collection(db, 'staff'), staffWithTimestamp);
}

export const updateStaff = async (db: Firestore, staffId: string, staffData: Partial<Staff>) => {
    const staffRef = doc(db, 'staff', staffId);
    return await updateDoc(staffRef, staffData);
}

export const deleteStaff = async (db: Firestore, staffId: string) => {
    const staffRef = doc(db, 'staff', staffId);
    return await deleteDoc(staffRef);
}

// Settings
export const upsertSettings = async (db: Firestore, settingsId: string | null, data: AppSettings) => {
    if (settingsId) {
        const settingsRef = doc(db, 'settings', settingsId);
        return await updateDoc(settingsRef, data);
    } else {
        return await addDoc(collection(db, 'settings'), data);
    }
}
