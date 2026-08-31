import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { DayItinerary } from '../types';

/**
 * Triggers direct browser download of a generated PDF file
 */
function downloadPdfBlob(pdf: jsPDF, filename: string): void {
  try {
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 2000);
  } catch (err) {
    console.warn('Blob URL download failed, falling back to pdf.save():', err);
    pdf.save(filename);
  }
}

export async function exportElementToPdf(element: HTMLElement, itinerary: DayItinerary): Promise<void> {
  const cleanTitle = (itinerary.title || '台鐵一日遊')
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim();
  const dateStr = itinerary.travelDate || '行程';
  const filename = `${cleanTitle}_台鐵一日遊行程表_${dateStr}.pdf`;

  // Wait a small tick to ensure any fonts or dynamic images are settled
  await new Promise((resolve) => setTimeout(resolve, 120));

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
        onclone: (clonedDoc) => {
          // Ensure all cloned elements are visible for rendering
          const clonedPage = clonedDoc.querySelector('.pdf-page');
          if (clonedPage) {
            (clonedPage as HTMLElement).style.visibility = 'visible';
          }
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) {
        pdf.addPage();
      }

      // Add full A4 page image without cropping
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }
  } else {
    // Fallback: If no .pdf-page markers, render entire element
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

  // Directly trigger browser download of the .pdf file
  downloadPdfBlob(pdf, filename);
}

