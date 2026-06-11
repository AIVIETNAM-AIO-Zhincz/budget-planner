import { useEffect, useState } from "react";
import { Button, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
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
  const [needLevel, setNeedLevel] = useState("optional");
  const [touched, setTouched] = useState(false);

  // Nạp lại giá trị mỗi khi mở dialog (thêm mới hoặc sửa).
  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setType(initial?.type ?? "expense");
      setParentId(initial?.parent_id ?? null);
      setNeedLevel(initial?.need_level ?? "optional");
      setTouched(false);
    }
  }, [open, initial]);

  const nameInvalid = !name.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (nameInvalid) return;
    await onSubmit({ name: name.trim(), type, parent_id: parentId, need_level: needLevel });
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

        {type === "expense" && (
          <TextField
            select
            label={t("categories.form.needLevel")}
            value={needLevel}
            onChange={(e) => setNeedLevel(e.target.value)}
            helperText={t("categories.form.needLevelHint")}
            fullWidth
          >
            <MenuItem value="mandatory">{t("needLevel.mandatory")}</MenuItem>
            <MenuItem value="optional">{t("needLevel.optional")}</MenuItem>
            <MenuItem value="wasteful">{t("needLevel.wasteful")}</MenuItem>
          </TextField>
        )}

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
