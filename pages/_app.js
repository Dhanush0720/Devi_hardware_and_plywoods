import '../styles/globals.css';
import { ThemeProvider } from 'next-themes';
import { CartProvider } from '../context/CartContext';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <CartProvider>
        <Component {...pageProps} />
      </CartProvider>
    </ThemeProvider>
  );
}
