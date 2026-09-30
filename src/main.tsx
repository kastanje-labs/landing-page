import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./components/Theme";
import { LandingConcept } from "./components/LandingConcept";
import "./base.css";
import "./design-tokens.css";
import "./brand-unified.css";
createRoot(document.getElementById("root")!).render(<React.StrictMode><ThemeProvider><LandingConcept concept="danmark" page={location.pathname.replace(/\/$/, "") === "/manifest" ? "manifest" : "home"} /></ThemeProvider></React.StrictMode>);
