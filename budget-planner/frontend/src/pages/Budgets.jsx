import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import ComingSoon from "../components/ComingSoon.jsx";

/** Trang Ngân sách (placeholder — chờ API). */
export default function Budgets() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t("pages.budgets")} description={t("pages.budgetsDesc")} />
      <ComingSoon />
    </>
  );
}
