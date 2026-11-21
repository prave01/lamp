import { ChatProvider } from "@/components/chat/chat-provider";
import { MobileNav } from "@/components/chat/mobile-nav";
import { ChatSidebar } from "@/components/chat/sidebar";

export default function ChatLayout({ children }: LayoutProps<"/chat">) {
  return (
    <ChatProvider>
      <div className="flex h-dvh overflow-hidden">
        <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:block">
          <ChatSidebar />
        </aside>

        <MobileNav />

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </ChatProvider>
  );
}
