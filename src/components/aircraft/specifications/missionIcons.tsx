import {
  Briefcase,
  Landmark,
  HeartHandshake,
  Siren,
  Binoculars,
  Gem,
  HardHat,
  Clapperboard,
  Package,
  AlertTriangle,
  Compass,
  type LucideIcon,
} from "lucide-react";
import type { MissionType } from "@/database/constants/mission-type";

export const MISSION_TYPE_ICONS: Record<MissionType, LucideIcon> = {
  business: Briefcase,
  government: Landmark,
  ngo_humanitarian: HeartHandshake,
  medical_evacuation: Siren,
  safari_tourism: Binoculars,
  vip_transport: Gem,
  mining_industrial: HardHat,
  film_media: Clapperboard,
  cargo: Package,
  emergency: AlertTriangle,
  other: Compass,
};