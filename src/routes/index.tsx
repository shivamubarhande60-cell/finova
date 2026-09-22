import { createFileRoute } from "@tanstack/react-router";
import { MarketingSite } from "@/components/marketing/site";

export const Route = createFileRoute("/")({ component: MarketingSite });
