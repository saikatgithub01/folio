import { useState } from "react";
import LandingPage from "./pages/LandingPage";
import FolioApp from "./app/FolioApp";

export default function App() {
  const [mode, setMode] = useState<"landing" | "app">("landing");
  return mode === "landing" ? <LandingPage onEnter={() => setMode("app")} /> : <FolioApp />;
}