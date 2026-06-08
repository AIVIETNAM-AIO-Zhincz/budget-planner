import { MenuItem, TextField } from "@mui/material";

const CURRENCIES = ["VND", "USD", "EUR", "JPY", "GBP", "AUD", "SGD", "KRW", "CNY", "THB"];

/**
 * Dropdown chọn mã tiền tệ phổ biến.
 *
 * @param {{value:string, onChange:Function, label?:string}} props
 */
export default function CurrencySelect({ value, onChange, label }) {
  return (
    <TextField
      select
      size="small"
      label={label}
      value={value || "VND"}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
    >
      {CURRENCIES.map((c) => (
        <MenuItem key={c} value={c}>
          {c}
        </MenuItem>
      ))}
    </TextField>
  );
}
