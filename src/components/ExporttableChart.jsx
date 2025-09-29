import { useRef } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

const ExportableChart = ({ children, fileName = "chart" }) => {
  const chartRef = useRef(null);

 const exportPDF = async () => {
  if (!chartRef.current) return;

  try {
    const dataUrl = await toPng(chartRef.current);
    const imgProps = new jsPDF().getImageProperties(dataUrl);

    // buat PDF dengan ukuran sesuai chart
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [imgProps.width, imgProps.height],
    });

    pdf.addImage(dataUrl, "PNG", 0, 0, imgProps.width, imgProps.height);
    pdf.save(`${fileName}.pdf`);
  } catch (err) {
    console.error("Gagal export PDF:", err);
  }
};


  return (
    <div className="p-4 border rounded-xl shadow">
      <div ref={chartRef}>{children}</div>

      <button
        onClick={exportPDF}
        className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Export PDF
      </button>
    </div>
  );
};

export default ExportableChart;
