import { Box, Paper, Typography } from "@mui/material";

/**
 * Khối "trạng thái rỗng" dùng chung: icon + tiêu đề + mô tả + (tuỳ chọn) nút hành động.
 * `bare` → bỏ khung Paper (dùng khi đặt bên trong một Paper/bảng sẵn có).
 *
 * @param {{icon?:React.ReactNode, title:string, description?:string,
 *          action?:React.ReactNode, bare?:boolean}} props
 */
export default function EmptyState({ icon, title, description, action, bare = false }) {
  const Wrapper = bare ? Box : Paper;
  return (
    <Wrapper
      sx={{
        p: { xs: 4, md: 6 },
        borderRadius: 3,
        ...(bare ? {} : { border: (theme) => `1px dashed ${theme.palette.divider}` }),
        textAlign: "center",
        display: "grid",
        placeItems: "center",
        gap: 1.5,
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 3,
            display: "grid",
            placeItems: "center",
            background: "rgba(99, 102, 241, 0.12)",
            color: "primary.main",
          }}
        >
          {icon}
        </Box>
      )}
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 440 }}>
          {description}
        </Typography>
      )}
      {action}
    </Wrapper>
  );
}
