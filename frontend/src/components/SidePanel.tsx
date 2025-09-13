"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Users, User } from "lucide-react";

const navigation = [
    {
        name: "Home",
        href: "/",
        icon: Home,
    },
    {
        name: "People",
        href: "/people",
        icon: Users,
    },
    {
        name: "Profile",
        href: "/profile",
        icon: User,
    },
];

export function SidePanel() {
    const pathname = usePathname();

    return (
        <>
            {/* Desktop Side Panel */}
            <div className="hidden md:flex h-screen w-16 lg:w-64 flex-col bg-background border-r border-border">
                <div className="flex h-16 items-center justify-center lg:justify-start lg:px-6">
                </div>

                <nav className="flex-1 space-y-1 px-2 lg:px-3 py-4">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center justify-center lg:justify-start px-2 lg:px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-muted text-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <item.icon className="h-5 w-5 lg:mr-3" />
                                <span className="hidden lg:block">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border">
                <nav className="flex justify-around py-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center px-3 py-2 text-xs font-medium transition-colors",
                                    isActive
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="h-5 w-5 mb-1" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}