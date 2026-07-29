import { MISSION_TYPE_LABELS } from "@/database/constants/mission-type";
import type { MissionType } from "@/database/constants/mission-type";
import { MISSION_TYPE_ICONS } from "./missionIcons";

export function RecommendedMissions({ missions }: { missions: MissionType[] }) {
  if (missions.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2.5">
      {missions.map((mission) => {
        const Icon = MISSION_TYPE_ICONS[mission];
        return (
          <li
            key={mission}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-navy-900 transition-colors duration-300 hover:border-sky-400 hover:bg-sky-100/60"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-sky-600" aria-hidden="true" />
            {MISSION_TYPE_LABELS[mission]}
          </li>
        );
      })}
    </ul>
  );
}