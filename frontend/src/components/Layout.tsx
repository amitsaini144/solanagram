"use client";

import React from "react";
import { SidePanel } from "./SidePanel";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen">
      <SidePanel />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}