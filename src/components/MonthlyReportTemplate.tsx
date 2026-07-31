import { forwardRef } from "react";
import { formatMoney } from "@/lib/format";

export interface ReportCategoryRow {
  label: string;
  amount: number;
}

export interface ReportAccountRow {
  name: string;
  balance: number;
}

interface Props {
  monthLabel: string;
  income: number;
  expense: number;
  balance: number;
  categories: ReportCategoryRow[];
  accounts: ReportAccountRow[];
  generatedAt: string;
}

// Rendered off-screen (fixed, pushed far left) and captured via html2canvas —
// inline hex styles only, no Tailwind/dark-mode classes, so the snapshot
// looks identical regardless of the user's current theme.
export const MonthlyReportTemplate = forwardRef<HTMLDivElement, Props>(
  function MonthlyReportTemplate(
    { monthLabel, income, expense, balance, categories, accounts, generatedAt },
    ref
  ) {
    const maxCat = Math.max(1, ...categories.map((c) => c.amount));

    return (
      <div
        ref={ref}
        style={{
          position: "fixed",
          left: -99999,
          top: 0,
          width: 800,
          padding: 40,
          background: "#fffafc",
          fontFamily:
            "var(--font-noto-thai), 'Noto Sans Thai', system-ui, sans-serif",
          color: "#4a2b3a",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <div>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#c73a70" }}>
              Rubjai
            </div>
            <div style={{ fontSize: 15, color: "#8a5a6c", marginTop: 2 }}>
              รายงานสรุปประจำเดือน {monthLabel}
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#b98a9c", textAlign: "right" }}>
            สร้างเมื่อ {generatedAt}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
          <StatCard label="รายรับรวม" value={income} color="#059669" />
          <StatCard label="รายจ่ายรวม" value={expense} color="#e11d48" />
          <StatCard
            label="คงเหลือ"
            value={balance}
            color={balance >= 0 ? "#c73a70" : "#e11d48"}
          />
        </div>

        <div style={{ marginBottom: 32 }}>
          <SectionTitle>รายจ่ายตามหมวดหมู่</SectionTitle>
          {categories.length === 0 ? (
            <div style={{ fontSize: 13, color: "#b98a9c" }}>
              ไม่มีรายจ่ายเดือนนี้
            </div>
          ) : (
            categories.map((c) => (
              <div key={c.label} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  <span>{c.label}</span>
                  <span style={{ fontWeight: 600 }}>{formatMoney(c.amount)}</span>
                </div>
                <div
                  style={{
                    height: 10,
                    borderRadius: 5,
                    background: "#ffe9f2",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(c.amount / maxCat) * 100}%`,
                      background: "#f76ba3",
                      borderRadius: 5,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div>
          <SectionTitle>ยอดคงเหลือต่อกระเป๋า (ณ ปัจจุบัน)</SectionTitle>
          {accounts.length === 0 ? (
            <div style={{ fontSize: 13, color: "#b98a9c" }}>ไม่มีบัญชี</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.name} style={{ borderBottom: "1px solid #ffe9f2" }}>
                    <td style={{ padding: "9px 0" }}>{a.name}</td>
                    <td style={{ padding: "9px 0", textAlign: "right", fontWeight: 600 }}>
                      {formatMoney(a.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div
          style={{
            marginTop: 36,
            fontSize: 10,
            color: "#d3aebb",
            textAlign: "center",
          }}
        >
          สร้างโดย Rubjai — บันทึกรายรับรายจ่าย
        </div>
      </div>
    );
  }
);

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 16,
        fontWeight: 700,
        marginBottom: 14,
        color: "#c73a70",
      }}
    >
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        border: "1px solid #ffe9f2",
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 12, color: "#8a5a6c" }}>{label}</div>
      <div style={{ fontSize: 21, fontWeight: 700, color, marginTop: 5 }}>
        {formatMoney(value)}
      </div>
    </div>
  );
}
