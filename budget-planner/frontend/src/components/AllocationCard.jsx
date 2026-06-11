import { Box, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

/** Cấu hình màu + nhãn theo verdict đánh giá phân bổ. */
const VERDICT = {
  good: { color: "success", key: "verdictGood" },
  warning: { color: "warning", key: "verdictWarning" },
  unknown: { color: "default", key: "verdictUnknown" },
};

/** '0.453' → '45%'. */
function pctStr(x) {
  return `${Math.round((x || 0) * 100)}%`;
}

/** Một dòng nhóm 50/30/20: nhãn + actual%/target% + thanh tiến độ (màu theo ok). */
function GroupRow({ group, t }) {
  const color = group.ok ? "success" : "warning";
  const value = group.target_pct
    ? Math.min((group.actual_pct / group.target_pct) * 100, 100)
    : 0;
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="body2">{t(`reports.allocation.${group.key}`)}</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {pctStr(group.actual_pct)} ·{" "}
          {t("reports.allocationTarget", { pct: pctStr(group.target_pct) })}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={value}
        color={color}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
}

/** Thẻ "Mức độ hợp lý (50/30/20)": verdict + 3 nhóm + danh sách đề xuất. */
export default function AllocationCard({ data }) {
  const { t } = useTranslation();
  if (!data) return null;
  const v = VERDICT[data.verdict] || VERDICT.unknown;
  const known = data.verdict !== "unknown";

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
        <Chip label={t(`reports.allocation.${v.key}`)} color={v.color} size="small" />
        {known && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("reports.allocationSavings", { pct: pctStr(data.savings_rate) })}
          </Typography>
        )}
      </Stack>

      {known && (
        <Stack spacing={1.5}>
          {data.groups.map((g) => (
            <GroupRow key={g.key} group={g} t={t} />
          ))}
        </Stack>
      )}

      <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
        {data.findings.map((f, i) => (
          <Typography key={i} component="li" variant="body2" sx={{ color: "text.secondary" }}>
            {f}
          </Typography>
        ))}
      </Stack>
    </Stack>
  );
}
