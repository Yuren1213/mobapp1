import { ThemeProvider } from "./contexts/ThemeContext";
import Navigation from "./navigation/navigation";

export default function App() {
  return (
    <ThemeProvider>
      <Navigation />
    </ThemeProvider>
  );
}
