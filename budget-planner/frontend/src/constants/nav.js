import {
  Squares2X2Icon,
  ArrowsRightLeftIcon,
  SparklesIcon,
  TagIcon,
  BanknotesIcon,
  WalletIcon,
  ArrowPathIcon,
  ChartBarIcon,
  UsersIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

/**
 * Khai báo các nhóm điều hướng của sidebar.
 * Nhãn lưu dưới dạng key i18n (`labelKey`), dịch bằng t() lúc render
 * để menu tự đổi ngôn ngữ khi chuyển vi/en.
 */
export const navSections = [
  {
    titleKey: "nav.section.overview",
    items: [
      { labelKey: "nav.dashboard", path: "/", icon: Squares2X2Icon },
      { labelKey: "nav.transactions", path: "/transactions", icon: ArrowsRightLeftIcon },
      { labelKey: "nav.assistant", path: "/assistant", icon: SparklesIcon },
      { labelKey: "nav.reports", path: "/reports", icon: ChartBarIcon },
    ],
  },
  {
    titleKey: "nav.section.manage",
    items: [
      { labelKey: "nav.categories", path: "/categories", icon: TagIcon },
      { labelKey: "nav.budgets", path: "/budgets", icon: BanknotesIcon },
      { labelKey: "nav.wallets", path: "/wallets", icon: WalletIcon },
      { labelKey: "nav.recurring", path: "/recurring", icon: ArrowPathIcon },
      { labelKey: "nav.members", path: "/members", icon: UsersIcon },
    ],
  },
  {
    titleKey: "nav.section.system",
    items: [{ labelKey: "nav.settings", path: "/settings", icon: Cog6ToothIcon }],
  },
];

export default navSections;
