import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import ComingSoon from "../components/ComingSoon.jsx";

/** Trang Danh mục (placeholder — chờ API). */
export default function Categories() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t("pages.categories")} description={t("pages.categoriesDesc")} />
      <ComingSoon />
    </>
  );
}
