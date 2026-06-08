import { Box, Paper, Typography } from "@mui/material";
import { BanknotesIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "react-i18next";

/**
 * Khung trang xác thực: căn giữa màn hình + thẻ chứa logo/brand + nội dung.
 *
 * @param {{title:string, children:React.ReactNode}} props
 */
export default function AuthShell({ title, children }) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 2,
        bgcolor: "background.default",
      }}
    >
      <Paper
        sx={{
          width: "100%",
          maxWidth: 420,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, #6366f1, #818cf8)",
              color: "#fff",
            }}
          >
            <BanknotesIcon width={22} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 18, lineHeight: 1.1 }}>
              {t("app.title")}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              {t("auth.subtitle")}
            </Typography>
          </Box>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, mt: 2.5, mb: 2 }}>
          {title}
        </Typography>
        {children}
      </Paper>
    </Box>
  );
}
