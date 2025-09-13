"use client"
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Instagram } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <header className="fixed top-0 z-40 w-full">
      <div className="w-full max-w-screen-2xl mx-auto flex h-14 items-center px-4 md:px-6">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2 px-2 py-2 md:px-0 md:py-0">
            <Instagram className="hidden md:block h-5 w-5 flex-shrink-0" />
            <span className="font-medium bg-gradient-to-tr from-yellow-300 via-pink-500 to-indigo-600 bg-clip-text text-transparent hidden lg:block">
              Solagram
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
          </div>
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
            {!isClient ? <p className="text-white pr-10 pt-2">Loading...</p> : <WalletMultiButton />}
          </nav>
        </div>
      </div>
    </header>
  );
}