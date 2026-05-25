import { createFileRoute } from "@tanstack/react-router";
import { CaraBot } from "@/components/CaraBot";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "CaraBot — NCD Care Malaysia" },
      { name: "description", content: "Chat with CaraBot, your AI NCD health assistant." },
    ],
  }),
  component: AssistantPage,
});

function AssistantPage() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto h-[calc(100vh-180px)] md:h-[calc(100vh-120px)] flex flex-col">
      <h1 className="text-2xl md:text-3xl font-semibold mb-4">CaraBot</h1>
      <div className="flex-1 min-h-0">
        <CaraBot embedded />
      </div>
    </div>
  );
}
