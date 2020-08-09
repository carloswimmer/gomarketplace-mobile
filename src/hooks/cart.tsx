import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:cart',
      );

      if (storagedProducts) setProducts([...JSON.parse(storagedProducts)]);
    }

    loadProducts();
  }, []);

  const saveOnStorage = useCallback(async newProducts => {
    await AsyncStorage.setItem(
      '@GoMarketplace:cart',
      JSON.stringify(newProducts),
    );
  }, []);

  const increment = useCallback(
    async id => {
      const index = products.findIndex(item => item.id === id);

      products[index].quantity += 1;

      await saveOnStorage(products);

      setProducts([...products]);
    },
    [products, saveOnStorage],
  );

  const addToCart = useCallback(
    async product => {
      const alreadyOnCart = products.find(item => item.id === product.id);

      if (alreadyOnCart) {
        increment(alreadyOnCart.id);

        return;
      }

      const newProduct: Product = { ...product };
      newProduct.quantity = 1;

      await saveOnStorage([...products, newProduct]);

      setProducts([...products, newProduct]);
    },
    [products, increment, saveOnStorage],
  );

  const decrement = useCallback(
    async id => {
      const index = products.findIndex(item => item.id === id);

      if (products[index].quantity <= 1) {
        products.splice(index, 1);

        await saveOnStorage(products);

        setProducts([...products]);

        return;
      }

      products[index].quantity -= 1;

      await saveOnStorage(products);

      setProducts([...products]);
    },
    [products, saveOnStorage],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
