import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * Shared chrome for the storefront. Rendering Navbar + Footer here (instead of
 * inside each page) means they persist across client-side navigations: the
 * header no longer unmounts/remounts on every route change, so the auth state
 * and search box stay stable instead of flickering.
 */
export default function StorefrontLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
