import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import ComingSoon from "../components/ComingSoon.jsx";

/** Trang Thành viên / RBAC (placeholder — chờ API). */
export default function Members() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t("pages.members")} description={t("pages.membersDesc")} />
      <ComingSoon />
    </>
  );
}
