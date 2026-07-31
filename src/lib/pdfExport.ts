// Loaded on demand (dynamic import) so jspdf/html2canvas never bloat the
// initial bundle — only paid for when the user actually exports a PDF.
export async function exportNodeAsPdf(node: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#fffafc",
    useCORS: true,
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 10;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    margin,
    margin,
    imgWidth,
    imgHeight
  );
  pdf.save(filename);
}
