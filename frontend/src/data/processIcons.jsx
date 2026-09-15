import {
  FiPenTool,
  FiEdit,
  FiLayers,
  FiGrid,
  FiCpu,
  FiSettings,
  FiTool,
  FiScissors,
  FiZap,
  FiSearch,
  FiEye,
  FiCrosshair,
  FiCheckCircle,
  FiClipboard,
  FiShield,
  FiPackage,
  FiBox,
  FiTruck,
  FiPrinter,
  FiAward,
} from 'react-icons/fi';

/**
 * Turns the API's icon ids into components.
 *
 * The backend stores only an abstract id (see config/processIcons.ts there) and
 * validates it against the same list. This file is the only place an id becomes
 * markup, which is what lets the icon set be swapped without a migration — and
 * what keeps the database free of anything renderable.
 *
 * Keep these keys in step with PROCESS_ICON_IDS on the API. An id that arrives
 * without an entry here falls back rather than rendering nothing.
 */
export const PROCESS_ICONS = {
  'pen-tool': FiPenTool,
  edit: FiEdit,
  layers: FiLayers,
  grid: FiGrid,
  cpu: FiCpu,
  settings: FiSettings,
  tool: FiTool,
  scissors: FiScissors,
  zap: FiZap,
  search: FiSearch,
  eye: FiEye,
  crosshair: FiCrosshair,
  'check-circle': FiCheckCircle,
  clipboard: FiClipboard,
  shield: FiShield,
  package: FiPackage,
  box: FiBox,
  truck: FiTruck,
  printer: FiPrinter,
  award: FiAward,
};

export const DEFAULT_PROCESS_ICON_ID = 'pen-tool';

/** Every id, in the order the admin picker should offer them. */
export const PROCESS_ICON_IDS = Object.keys(PROCESS_ICONS);

/**
 * The component for an id, never undefined.
 *
 * A stage saved under an id this build does not know about still draws
 * something — an unrecognised icon should not leave a hole in the flow.
 */
export const getProcessIcon = (id) =>
  PROCESS_ICONS[id] ?? PROCESS_ICONS[DEFAULT_PROCESS_ICON_ID];
