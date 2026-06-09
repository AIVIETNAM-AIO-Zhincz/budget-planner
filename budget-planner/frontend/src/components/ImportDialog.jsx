import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import BrandDialog from "./BrandDialog.jsx";
import { importTransactions } from "../api/transactions.js";
import { ApiError } from "../api/client.js";
import { formatAmount } from "../utils/format.js";

/**
 * Dialog nhập CSV: chọn file → preview (dry-run) → xác nhận Import.
 *
 * @param {{open:boolean, onClose:Function, onDone:(created:number)=>void}} props
 */
export default function ImportDialog({ open, onClose, onDone }) {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setFile(null);
    setResult(null);
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng file
    if (!f) return;
    setFile(f);
    setResult(null);
    setError("");
    setBusy(true);
    try {
      setResult(await importTransactions(f, true)); // dry-run
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("transactions.import.parseError"));
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const r = await importTransactions(file, false);
      onDone(r.created);
      handleClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("transactions.import.parseError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <BrandDialog
      open={open}
      onClose={busy ? () => {} : handleClose}
      title={t("transactions.import.title")}
      actions={
        <>
          <Button onClick={handleClose} disabled={busy} className="no-hover-lift">
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={busy || !result || result.valid_count === 0}
          >
            {t("transactions.import.doImport")}
            {result ? ` (${result.valid_count})` : ""}
          </Button>
        </>
      }
    >
      <Stack spacing={2} sx={{ pt: 0.5 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {t("transactions.import.columnsHint")}
        </Typography>

        <Button component="label" variant="outlined" startIcon={<ArrowUpTrayIcon width={18} />} className="no-hover-lift">
          {file ? file.name : t("transactions.import.chooseFile")}
          <input type="file" accept=".csv,text/csv" hidden onChange={handleFile} />
        </Button>

        {busy && <LinearProgress sx={{ borderRadius: 4 }} />}
        {error && <Alert severity="error">{error}</Alert>}

        {result && (
          <>
            <Stack direction="row" spacing={1}>
              <Chip
                color="success"
                variant="outlined"
                label={t("transactions.import.validCount", { count: result.valid_count })}
              />
              {result.error_count > 0 && (
                <Chip
                  color="error"
                  variant="outlined"
                  label={t("transactions.import.errorCount", { count: result.error_count })}
                />
              )}
            </Stack>

            {result.preview.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {t("transactions.import.previewTitle")}
                </Typography>
                <Table size="small" sx={{ mt: 0.5 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("transactions.colDate")}</TableCell>
                      <TableCell>{t("transactions.colNote")}</TableCell>
                      <TableCell>{t("transactions.colCategory")}</TableCell>
                      <TableCell align="right">{t("transactions.colAmount")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.preview.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.date}</TableCell>
                        <TableCell>{r.note}</TableCell>
                        <TableCell>{r.category_name}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                          {r.type === "income" ? "+" : "−"}
                          {formatAmount(r.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}

            {result.errors.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: "error.main", fontWeight: 600 }}>
                  {t("transactions.import.errorsTitle")}
                </Typography>
                <Stack spacing={0.25} sx={{ mt: 0.5, maxHeight: 140, overflowY: "auto" }}>
                  {result.errors.map((e, i) => (
                    <Typography key={i} variant="caption" sx={{ color: "text.secondary" }}>
                      {t("transactions.import.lineLabel", { line: e.line })}: {e.message}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}
          </>
        )}
      </Stack>
    </BrandDialog>
  );
}
