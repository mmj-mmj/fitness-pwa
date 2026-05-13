import { Dumbbell, History, Home, LineChart, Settings } from "lucide-react";
import { useState } from "react";
import { DashboardPage } from "./features/dashboard/DashboardPage.jsx";
import { WorkoutEntryPage } from "./features/workout-entry/WorkoutEntryPage.jsx";
import { HistoryPage } from "./features/history/HistoryPage.jsx";
import { StatsPage } from "./features/stats/StatsPage.jsx";
import { SettingsPage } from "./features/settings/SettingsPage.jsx";
import { useAuth } from "./lib/useAuth.js";
import { useWorkouts } from "./lib/useWorkouts.js";

const tabs = [
  { id: "home", label: "首页", icon: Home, component: DashboardPage },
  { id: "record", label: "记录", icon: Dumbbell, component: WorkoutEntryPage },
  { id: "history", label: "历史", icon: History, component: HistoryPage },
  { id: "stats", label: "统计", icon: LineChart, component: StatsPage },
  { id: "settings", label: "我的", icon: Settings, component: SettingsPage },
];

export default function App() {
  const auth = useAuth();
  const workoutStore = useWorkouts(auth);
  const [activeTab, setActiveTab] = useState("home");
  const ActivePage = tabs.find((tab) => tab.id === activeTab).component;

  return (
    <main className="app-shell">
      <ActivePage auth={auth} workoutStore={workoutStore} goToTab={setActiveTab} />
      <nav className="bottom-tabs" aria-label="主导航">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            aria-current={id === activeTab ? "page" : undefined}
            className={id === activeTab ? "active" : ""}
            key={id}
            onClick={() => setActiveTab(id)}
            type="button"
          >
            <Icon aria-hidden="true" size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
