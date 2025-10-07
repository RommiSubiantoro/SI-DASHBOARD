import { useRef } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

const ExportableChart = ({ children, fileName = "chart" }) => {
  const chartRef = useRef(null);

  const exportPDF = async () => {
    if (!chartRef.current) return;

    try {
      // 1️⃣ Scroll ke elemen chart (kalau di luar viewport)
      chartRef.current.scrollIntoView({ behavior: "instant", block: "start" });

      // 2️⃣ Tunggu render selesai (agar grafik benar-benar tampil penuh)
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 3️⃣ Gunakan lebar & tinggi aktual dari elemen (bukan yang terlihat)
      const width = chartRef.current.scrollWidth;
      const height = chartRef.current.scrollHeight;

      // 4️⃣ Ambil gambar full ukuran chart
      const dataUrl = await toPng(chartRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2, // kualitas tinggi
        width,
        height,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });

      // 5️⃣ Buat PDF sesuai ukuran chart
      const pdf = new jsPDF({
        orientation: width > height ? "landscape" : "portrait",
        unit: "px",
        format: [width, height],
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
      pdf.save(`${fileName}.pdf`);
    } catch (err) {
      console.error("Gagal export PDF:", err);
    }
  };

  return (
    <div className="p-4 border rounded-xl shadow overflow-x-auto">
      <div ref={chartRef} className="w-full">
        {children}
      </div>

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
