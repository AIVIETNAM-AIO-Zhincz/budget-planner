import { Box, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

/**
 * Khối "Sắp ra mắt" cho các trang chưa có API ở backend.
 *
 * @param {{hint?:string}} props
 */
export default function ComingSoon({ hint }) {
  const { t } = useTranslation();
  return (
    <Paper
      sx={{
        p: { xs: 4, md: 6 },
        borderRadius: 3,
        border: (theme) => `1px dashed ${theme.palette.divider}`,
        textAlign: "center",
        display: "grid",
        placeItems: "center",
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: 3,
          display: "grid",
          placeItems: "center",
          background: "rgba(99, 102, 241, 0.12)",
          color: "primary.main",
        }}
      >
        <WrenchScrewdriverIcon width={30} />
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {t("common.comingSoon")}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 420 }}>
        {hint || t("common.comingSoonDesc")}
      </Typography>
    </Paper>
  );
}
