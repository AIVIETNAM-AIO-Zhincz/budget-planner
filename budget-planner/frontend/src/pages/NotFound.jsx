import { Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

/** Trang 404. */
export default function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Box sx={{ textAlign: "center", py: { xs: 6, md: 10 }, display: "grid", gap: 2, placeItems: "center" }}>
      <Typography sx={{ fontSize: 72, fontWeight: 800, fontFamily: '"JetBrains Mono", monospace', color: "primary.main" }}>
        404
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {t("common.notFound")}
      </Typography>
      <Button variant="contained" onClick={() => navigate("/")}>
        {t("common.backHome")}
      </Button>
    </Box>
  );
}
