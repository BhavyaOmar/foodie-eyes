import TopBar from "./components/TopBar";
import SearchHero from "./components/SearchHero";
import MoodCards from "./components/MoodCards";


export default function Home() {
  return (
    <main className="min-h-dvh bg-black">
      <TopBar />
      <MoodCards />
      <SearchHero />
      
    </main>
  );
}
