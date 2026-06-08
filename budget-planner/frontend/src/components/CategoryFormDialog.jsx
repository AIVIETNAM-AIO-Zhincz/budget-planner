import { useEffect, useState } from "react";
import { Button, Stack, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useTranslation } from "react-i18next";
import BrandDialog from "./BrandDialog.jsx";
import CategorySelect from "./CategorySelect.jsx";

/**
 * Dialog thêm/sửa danh mục. `initial` có giá trị → chế độ sửa.
 *
 * @param {{open:boolean, onClose:Function, onSubmit:Function, submitting:boolean,
 *          initial?:{id:string,name:string,type:string,parent_id:string|null}|null}} props
 */
export default function CategoryFormDialog({ open, onClose, onSubmit, submitting, initial }) {
  const { t } = useTranslation();
  const isEdit = Boolean(initial);
  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [parentId, setParentId] = useState(null);
  const [touched, setTouched] = useState(false);

  // Nạp lại giá trị mỗi khi mở dialog (thêm mới hoặc sửa).
  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setType(initial?.type ?? "expense");
      setParentId(initial?.parent_id ?? null);
      setTouched(false);
    }
  }, [open, initial]);

  const nameInvalid = !name.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (nameInvalid) return;
    await onSubmit({ name: name.trim(), type, parent_id: parentId });
  };

  return (
    <BrandDialog
      open={open}
      onClose={submitting ? () => {} : onClose}
      title={isEdit ? t("categories.form.editTitle") : t("categories.form.addTitle")}
      PaperProps={{ component: "form", onSubmit: handleSubmit }}
      actions={
        <>
          <Button onClick={onClose} disabled={submitting} className="no-hover-lift">
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <Stack spacing={2.5} sx={{ pt: 0.5 }}>
        <ToggleButtonGroup
          value={type}
          exclusive
          onChange={(_, v) => v && setType(v)}
          fullWidth
          size="small"
        >
          <ToggleButton value="expense" color="error">
            {t("categories.expense")}
          </ToggleButton>
          <ToggleButton value="income" color="success">
            {t("categories.income")}
          </ToggleButton>
        </ToggleButtonGroup>

        <TextField
          label={t("categories.form.name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={touched && nameInvalid}
          helperText={touched && nameInvalid ? t("categories.form.nameRequired") : " "}
          autoFocus
          fullWidth
        />

        <CategorySelect
          label={t("categories.form.parent")}
          value={parentId}
          onChange={setParentId}
          excludeId={initial?.id}
          allowNone
        />
      </Stack>
    </BrandDialog>
  );
}
