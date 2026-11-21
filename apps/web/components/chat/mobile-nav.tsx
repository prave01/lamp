"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { ChatSidebar } from "@/components/chat/sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Below md the rail lives in a sheet, closed again once a session is picked.
export function MobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open sessions"
          className="fixed top-2.5 left-3 z-20 md:hidden"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-0 bg-sidebar p-0 sm:max-w-72">
        <SheetTitle className="sr-only">Sessions</SheetTitle>
        <SheetDescription className="sr-only">
          Switch between your chats or start a new one.
        </SheetDescription>
        <ChatSidebar onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
