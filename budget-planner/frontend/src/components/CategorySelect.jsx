import { useEffect, useState } from "react";
import { MenuItem, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import { listCategories } from "../api/categories.js";

/**
 * Dropdown chọn danh mục, tự đổ dữ liệu từ GET /categories.
 *
 * @param {{value:string, onChange:Function, label?:string, typeFilter?:string,
 *          excludeId?:string, allowNone?:boolean, noneLabel?:string,
 *          required?:boolean, error?:boolean, helperText?:string}} props
 */
export default function CategorySelect({
  value,
  onChange,
  label,
  typeFilter,
  excludeId,
  allowNone = false,
  noneLabel,
  required = false,
  error = false,
  helperText,
}) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let active = true;
    listCategories()
      .then((data) => {
        if (active) setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setCategories([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const options = categories
    .filter((c) => (typeFilter ? c.type === typeFilter : true))
    .filter((c) => c.id !== excludeId);

  return (
    <TextField
      select
      label={label || t("nav.categories")}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      required={required}
      error={error}
      helperText={helperText}
      fullWidth
    >
      {allowNone && <MenuItem value="">{noneLabel || t("categories.form.parentNone")}</MenuItem>}
      {options.map((c) => (
        <MenuItem key={c.id} value={c.id}>
          {c.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
