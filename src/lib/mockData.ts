export interface Item {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  dateAdded: string;
  mfgDate: string;
  expDate: string;
  remindDate: string;
  imageUrl?: string;
  totalIn: number;
  totalOut: number;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  date: string;
  note: string;
  createdBy: string;
}

export interface Category {
  id: string;
  name: string;
  itemCount: number;
}

export interface Brand {
  id: string;
  name: string;
  itemCount: number;
}

export const categories: Category[] = [
  { id: '1', name: 'شیری مندال', itemCount: 15 },
  { id: '2', name: 'خواردنەوە', itemCount: 22 },
  { id: '3', name: 'پاککەرەوە', itemCount: 18 },
  { id: '4', name: 'حەلوێک', itemCount: 12 },
  { id: '5', name: 'دەرمان', itemCount: 8 },
  { id: '6', name: 'خۆراکی تایبەت', itemCount: 10 },
];

export const brands: Brand[] = [
  { id: '1', name: 'نستلە', itemCount: 25 },
  { id: '2', name: 'جونسن', itemCount: 18 },
  { id: '3', name: 'پامپرس', itemCount: 12 },
  { id: '4', name: 'ھیرۆ', itemCount: 15 },
  { id: '5', name: 'سیمیلاک', itemCount: 10 },
];

export const items: Item[] = [
  {
    id: '1',
    barcode: '8901234567890',
    name: 'شیری نستلە NAN 1',
    brand: 'نستلە',
    category: 'شیری مندال',
    unit: 'دانە',
    quantity: 45,
    minStock: 10,
    dateAdded: '2024-01-15',
    mfgDate: '2024-01-01',
    expDate: '2025-01-01',
    remindDate: '2024-12-01',
    totalIn: 100,
    totalOut: 55,
  },
  {
    id: '2',
    barcode: '8901234567891',
    name: 'شیری سیمیلاک گۆڵد',
    brand: 'سیمیلاک',
    category: 'شیری مندال',
    unit: 'دانە',
    quantity: 8,
    minStock: 15,
    dateAdded: '2024-02-10',
    mfgDate: '2024-02-01',
    expDate: '2024-12-15',
    remindDate: '2024-12-01',
    totalIn: 50,
    totalOut: 42,
  },
  {
    id: '3',
    barcode: '8901234567892',
    name: 'پەتى پامپرس سایز 3',
    brand: 'پامپرس',
    category: 'پاککەرەوە',
    unit: 'پاکیت',
    quantity: 30,
    minStock: 20,
    dateAdded: '2024-03-05',
    mfgDate: '2024-03-01',
    expDate: '2026-03-01',
    remindDate: '2026-02-01',
    totalIn: 80,
    totalOut: 50,
  },
  {
    id: '4',
    barcode: '8901234567893',
    name: 'سیریلاک گەنمین',
    brand: 'نستلە',
    category: 'خۆراکی تایبەت',
    unit: 'دانە',
    quantity: 22,
    minStock: 10,
    dateAdded: '2024-01-20',
    mfgDate: '2024-01-15',
    expDate: '2024-12-10',
    remindDate: '2024-11-25',
    totalIn: 60,
    totalOut: 38,
  },
  {
    id: '5',
    barcode: '8901234567894',
    name: 'شامپۆی جونسن',
    brand: 'جونسن',
    category: 'پاککەرەوە',
    unit: 'دانە',
    quantity: 5,
    minStock: 12,
    dateAdded: '2024-02-25',
    mfgDate: '2024-02-01',
    expDate: '2025-02-01',
    remindDate: '2025-01-01',
    totalIn: 40,
    totalOut: 35,
  },
  {
    id: '6',
    barcode: '8901234567895',
    name: 'قەنای ھیرۆ',
    brand: 'ھیرۆ',
    category: 'خواردنەوە',
    unit: 'دانە',
    quantity: 0,
    minStock: 8,
    dateAdded: '2024-01-10',
    mfgDate: '2024-01-01',
    expDate: '2024-11-30',
    remindDate: '2024-11-15',
    totalIn: 25,
    totalOut: 25,
  },
  {
    id: '7',
    barcode: '8901234567896',
    name: 'کریمی مندال جونسن',
    brand: 'جونسن',
    category: 'پاککەرەوە',
    unit: 'دانە',
    quantity: 18,
    minStock: 10,
    dateAdded: '2024-03-01',
    mfgDate: '2024-02-15',
    expDate: '2025-08-15',
    remindDate: '2025-07-15',
    totalIn: 35,
    totalOut: 17,
  },
  {
    id: '8',
    barcode: '8901234567897',
    name: 'شیری ھیرۆ 2',
    brand: 'ھیرۆ',
    category: 'شیری مندال',
    unit: 'دانە',
    quantity: 12,
    minStock: 10,
    dateAdded: '2024-02-20',
    mfgDate: '2024-02-10',
    expDate: '2024-12-20',
    remindDate: '2024-12-05',
    totalIn: 45,
    totalOut: 33,
  },
];

export const stockMovements: StockMovement[] = [
  {
    id: '1',
    itemId: '1',
    itemName: 'شیری نستلە NAN 1',
    type: 'IN',
    quantity: 20,
    date: '2024-11-01',
    note: 'کڕین لە کۆمپانیای نستلە',
    createdBy: 'ئەدمین',
  },
  {
    id: '2',
    itemId: '1',
    itemName: 'شیری نستلە NAN 1',
    type: 'OUT',
    quantity: 5,
    date: '2024-11-05',
    note: 'فرۆشتن بۆ کڕیار',
    createdBy: 'ئەدمین',
  },
  {
    id: '3',
    itemId: '2',
    itemName: 'شیری سیمیلاک گۆڵد',
    type: 'OUT',
    quantity: 3,
    date: '2024-11-08',
    note: 'فرۆشتن',
    createdBy: 'ئەدمین',
  },
  {
    id: '4',
    itemId: '3',
    itemName: 'پەتى پامپرس سایز 3',
    type: 'IN',
    quantity: 15,
    date: '2024-11-10',
    note: 'داواکاری نوێ',
    createdBy: 'ئەدمین',
  },
  {
    id: '5',
    itemId: '5',
    itemName: 'شامپۆی جونسن',
    type: 'OUT',
    quantity: 8,
    date: '2024-11-12',
    note: 'فرۆشتن بۆ فرۆشگا',
    createdBy: 'ئەدمین',
  },
];

export const getDashboardStats = () => {
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const expiredItems = items.filter(item => new Date(item.expDate) < new Date()).length;
  const lowStockItems = items.filter(item => item.quantity <= item.minStock).length;
  const outOfStock = items.filter(item => item.quantity === 0).length;
  
  const today = new Date();
  const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const soonToExpire = items.filter(item => {
    const expDate = new Date(item.expDate);
    return expDate > today && expDate <= thirtyDaysLater;
  }).length;

  return {
    totalItems,
    totalQuantity,
    expiredItems,
    lowStockItems,
    outOfStock,
    soonToExpire,
  };
};

export const getExpiredItems = () => {
  const today = new Date();
  return items.filter(item => new Date(item.expDate) < today);
};

export const getSoonToExpireItems = (days: number = 30) => {
  const today = new Date();
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  return items.filter(item => {
    const expDate = new Date(item.expDate);
    return expDate > today && expDate <= futureDate;
  });
};

export const getLowStockItems = () => {
  return items.filter(item => item.quantity <= item.minStock && item.quantity > 0);
};

export const getOutOfStockItems = () => {
  return items.filter(item => item.quantity === 0);
};

export const getTopMovingItems = () => {
  return [...items].sort((a, b) => b.totalOut - a.totalOut).slice(0, 5);
};
