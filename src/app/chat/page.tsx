import { Suspense } from "react";
import { ChatArea } from "@/components/ChatArea";
import { ProductShell } from "@/components/ProductShell";

export default function ChatPage() {
  return (
    <ProductShell>
      <Suspense fallback={<div className="product-frame p-6 text-sm text-slate-300">Carregando conversa...</div>}>
        <ChatArea />
      </Suspense>
    </ProductShell>
  );
}
