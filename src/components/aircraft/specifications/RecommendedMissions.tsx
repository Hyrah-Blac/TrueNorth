import { MISSION_TYPE_LABELS } from "@/database/constants/mission-type";
import type { MissionType } from "@/database/constants/mission-type";
import { MISSION_TYPE_ICONS } from "./missionIcons";

export function RecommendedMissions({ missions }: { missions: MissionType[] }) {
  if (missions.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {missions.map((mission) => {
        const Icon = MISSION_TYPE_ICONS[mission];
        return (
          <li
            key={mission}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[0.6875rem] font-medium text-navy-900 transition-colors duration-300 hover:border-navy-300 hover:bg-navy-50"
          >
            <Icon className="h-3 w-3 shrink-0 text-navy-900" aria-hidden="true" />
            {MISSION_TYPE_LABELS[mission]}
          </li>
        );
      })}
    </ul>
  );
}