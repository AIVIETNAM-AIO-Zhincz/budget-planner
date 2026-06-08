import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import ComingSoon from "../components/ComingSoon.jsx";

/** Trang Cài đặt không gian (placeholder — chờ API). */
export default function Settings() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t("pages.settings")} description={t("pages.settingsDesc")} />
      <ComingSoon />
    </>
  );
}
