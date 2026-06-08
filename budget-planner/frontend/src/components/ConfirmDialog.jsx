import { Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import BrandDialog from "./BrandDialog.jsx";

/**
 * Dialog xác nhận hành động (mặc định cho xoá).
 *
 * @param {{open:boolean, title:string, message:string, onCancel:Function,
 *          onConfirm:Function, confirming?:boolean, confirmLabel?:string}} props
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  confirming = false,
  confirmLabel,
}) {
  const { t } = useTranslation();
  return (
    <BrandDialog
      open={open}
      onClose={onCancel}
      title={title}
      maxWidth="xs"
      actions={
        <>
          <Button onClick={onCancel} disabled={confirming} className="no-hover-lift">
            {t("common.cancel")}
          </Button>
          <Button color="error" variant="contained" onClick={onConfirm} disabled={confirming}>
            {confirmLabel || t("common.delete")}
          </Button>
        </>
      }
    >
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {message}
      </Typography>
    </BrandDialog>
  );
}
