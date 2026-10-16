import type { Metadata } from "next";
import Workspace from "./Workspace";
export const metadata: Metadata = {
  title: "Meu espaço",
  robots: { index: false, follow: false },
};
export default function ChatWorkspacePage() {
  return <Workspace />;
}
