"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import {
  Home,
  Users,
  MessageSquare,
  Menu,
  Calendar,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Главная", href: "/", icon: Home },
    { name: "Пользователи", href: "/users", icon: Users },
    { name: "Чаты", href: "/chats", icon: MessageSquare },
    { name: "Календарь", href: "/calendar", icon: Calendar },
    { name: "Планы", href: "/plans", icon: CreditCard },
  ];

  const NavLink = ({
    item,
    onClick = () => {},
  }: {
    item: (typeof navItems)[0];
    onClick?: () => void;
  }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 transition-colors hover:text-foreground/80",
          isActive ? "text-foreground font-semibold" : "text-foreground/60",
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <header
      className={cn(
        "border-b bg-background sticky top-0 z-10 shadow-sm",
        className,
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Logo showText={true} size="sm" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="ml-auto">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <nav className="flex flex-col mt-8 gap-4 text-base">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  onClick={() => setIsOpen(false)}
                />
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export default Navigation;
