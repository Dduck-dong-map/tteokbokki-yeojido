import {
  ArrowRight,
  Bell,
  Book,
  Check,
  ChevronRight,
  Clock,
  Database,
  Download,
  FileText,
  Funnel,
  Inbox,
  Info,
  LayoutGrid,
  List,
  Lock,
  Map as MapIcon,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Smartphone,
  TriangleAlert,
  User,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";

// 어드민 아이콘. shadcn 아이콘(lucide-react, components.json 의 iconLibrary)을 쓴다.
// 화면은 이름으로만 고른다(<Icon name="inbox" />). 크기는 CSS(.admin-root … svg)가 정하고, 색은 currentColor 를 따른다.
// lucide 에 없는 우리만의 그림이 필요해지면 이 표에 넣지 말고 따로 부품으로 둔다.
const ICONS = {
  grid: LayoutGrid,
  inbox: Inbox,
  map: MapIcon,
  clock: Clock,
  message: MessageSquare,
  list: List,
  settings: Settings,
  book: Book,
  database: Database,
  users: Users,
  user: User,
  lock: Lock,
  shield: Shield,
  file: FileText,
  tools: Wrench,
  refresh: RefreshCw,
  "arrow-right": ArrowRight,
  "chevron-right": ChevronRight,
  plus: Plus,
  search: Search,
  filter: Funnel,
  download: Download,
  edit: Pencil,
  close: X,
  check: Check,
  info: Info,
  alert: TriangleAlert,
  bell: Bell,
  smartphone: Smartphone,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export function Icon({ name }: { name: IconName }) {
  const Glyph = ICONS[name];
  // 굵기 1.8 은 예전 어드민 아이콘과 같다
  return <Glyph strokeWidth={1.8} aria-hidden />;
}
