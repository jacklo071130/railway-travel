import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { DayItinerary } from '../types';

export async function exportElementToPdf(element: HTMLElement, itinerary: DayItinerary): Promise<void> {
  const cleanTitle = itinerary.title.replace(/[\\/:*?"<>|]/g, '_');
  const filename = `${cleanTitle}_AI台鐵一日遊行程表_${itinerary.travelDate || '行程'}.pdf`;

  // Wait a small tick to ensure any dynamic rendering or fonts are settled
  await new Promise((resolve) => setTimeout(resolve, 80));

  // Find all explicitly formatted A4 pages inside the container
  const pageNodes = Array.from(element.querySelectorAll<HTMLElement>('.pdf-page'));

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = 210; // A4 width in mm
  const pdfHeight = 297; // A4 height in mm

  if (pageNodes.length > 0) {
    // Process each pre-formatted A4 page individually to ensure ZERO text cutoffs
    for (let i = 0; i < pageNodes.length; i++) {
      const pageEl = pageNodes[i];

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) {
        pdf.addPage();
      }

      // Add full A4 page image without cropping
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }
  } else {
    // Fallback: If no .pdf-page markers, render element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
    });

    const margin = 8;
    const contentWidth = pdfWidth - margin * 2;
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = contentWidth / imgWidth;
    const totalPdfHeight = imgHeight * ratio;
    const pageContentHeight = pdfHeight - margin * 2;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (totalPdfHeight <= pageContentHeight) {
      pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, totalPdfHeight, undefined, 'FAST');
    } else {
      const pxPageHeight = Math.floor(canvas.width * (pageContentHeight / contentWidth));
      let renderedHeight = 0;
      let pageIndex = 0;

      while (renderedHeight < imgHeight) {
        const sliceHeight = Math.min(pxPageHeight, imgHeight - renderedHeight);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            renderedHeight,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight
          );

          const pageData = pageCanvas.toDataURL('image/jpeg', 0.95);
          const slicePdfHeight = sliceHeight * ratio;

          if (pageIndex > 0) {
            pdf.addPage();
          }
          pdf.addImage(pageData, 'JPEG', margin, margin, contentWidth, slicePdfHeight, undefined, 'FAST');
        }

        renderedHeight += pxPageHeight;
        pageIndex++;
      }
    }
  }

  // Generate Blob and trigger direct browser file download via standard <a> element
  try {
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = filename;
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobUrl);
    }, 1500);
  } catch {
    // Fallback directly to pdf.save()
    pdf.save(filename);
  }
}

