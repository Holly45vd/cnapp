// src/app/components/review/ReviewSummaryPills.jsx
import React from "react";
import { Card, CardContent, Stack, Typography, Box } from "@mui/material";

export default function ReviewSummaryPills({
  selectedDateKey,
  activeType,
  onChangeType,
  typeOrder,
  typeConfig,
  progressCounts,
}) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" fontWeight={700}>
            {selectedDateKey} 학습 복습
          </Typography>

          <Stack direction="row" spacing={1.5} justifyContent="center">
            {typeOrder.map((key) => {
              const cfg = typeConfig[key];
              const prog = progressCounts[key] || { done: 0, total: 0 };
              const done = prog.done || 0;
              const total = prog.total || 0;
              const isActive = activeType === key;

              return (
                <Box
                  key={key}
                  onClick={() => onChangeType(key)}
                  sx={{
                    cursor: "pointer",
                    borderRadius: "999px",
                    px: 1.8,
                    py: 1.3,
                    minWidth: 70,
                    bgcolor: cfg.pillBg,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isActive
                      ? "0 0 0 2px rgba(0,0,0,0.06)"
                      : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "#65708A", mb: 0.4 }}
                  >
                    {cfg.label}
                  </Typography>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      bgcolor: cfg.innerBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 16,
                    }}
                  >
                    {done}/{total}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
