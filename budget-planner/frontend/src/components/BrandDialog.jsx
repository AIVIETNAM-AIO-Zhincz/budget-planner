import { useId } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  IconButton,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { XMarkIcon } from "@heroicons/react/24/outline";
import useReducedMotion from "../hooks/useReducedMotion.js";

/**
 * Dialog dạng form chuẩn: header (tiêu đề + mô tả + nút đóng) / body / footer.
 * Mobile fullscreen, ARIA tự nối, tôn trọng reduced-motion.
 * Port rút gọn từ design system InTraAI (bỏ dirty-guard).
 *
 * @param {{open:boolean, onClose:Function, title:React.ReactNode, description?:React.ReactNode,
 *          actions?:React.ReactNode, maxWidth?:string, children:React.ReactNode}} props
 */
export default function BrandDialog({
  open,
  onClose,
  title,
  description,
  actions,
  maxWidth = "sm",
  children,
  ...rest
}) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const titleId = useId();
  const descId = useId();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Fade}
      transitionDuration={reduced ? 0 : undefined}
      aria-labelledby={title != null ? titleId : undefined}
      aria-describedby={description != null ? descId : undefined}
      {...rest}
    >
      <DialogTitle
        id={titleId}
        sx={(t) => ({
          display: "flex",
          alignItems: "flex-start",
          gap: 2,
          backgroundColor: t.palette.background.subtle ?? t.palette.action.hover,
          borderBottom: `1px solid ${t.palette.divider}`,
          paddingRight: 1.5,
        })}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ fontSize: 18, fontWeight: 700, lineHeight: 1.35 }}>{title}</Box>
          {description != null && (
            <Typography
              id={descId}
              component="div"
              sx={{ mt: 0.5, fontSize: 13, color: "text.secondary", lineHeight: 1.5 }}
            >
              {description}
            </Typography>
          )}
        </Box>
        <IconButton aria-label="close" onClick={onClose} size="small" sx={{ mt: -0.25, color: "text.secondary" }}>
          <XMarkIcon width={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>{children}</DialogContent>

      {actions != null && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
}
