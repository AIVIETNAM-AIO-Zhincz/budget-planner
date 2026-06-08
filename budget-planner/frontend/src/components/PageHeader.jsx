import { Box, Stack, Typography } from "@mui/material";

/**
 * Tiêu đề trang dùng chung: tên + mô tả + slot hành động bên phải.
 *
 * @param {{title:string, description?:string, actions?:React.ReactNode}} props
 */
export default function PageHeader({ title, description, actions }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      sx={{ mb: 3, gap: 1.5, alignItems: { sm: "center" }, justifyContent: "space-between" }}
    >
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
    </Stack>
  );
}
