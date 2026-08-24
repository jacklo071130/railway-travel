import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { DayItinerary } from '../types';

export async function exportElementToPdf(element: HTMLElement, itinerary: DayItinerary): Promise<void> {
  const cleanTitle = itinerary.title.replace(/[\\/:*?"<>|]/g, '_');
  const filename = `${cleanTitle}_AI台鐵一日遊行程表_${itinerary.travelDate}.pdf`;

  // Render high-definition canvas of printable sheet
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 794,
  });

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = 210; // A4 width in mm
  const pdfHeight = 297; // A4 height in mm
  const margin = 8; // 8mm margin
  const contentWidth = pdfWidth - (margin * 2); // 194mm
  
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = contentWidth / imgWidth;
  const totalPdfHeight = imgHeight * ratio;
  const pageContentHeight = pdfHeight - (margin * 2); // 281mm available per page

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  if (totalPdfHeight <= pageContentHeight) {
    // Single page output
    pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, totalPdfHeight);
  } else {
    // Clean multi-page generation using canvas slicing
    const pxPageHeight = Math.floor(canvas.width * (pageContentHeight / contentWidth));
    let renderedHeight = 0;
    let pageIndex = 0;

    while (renderedHeight < imgHeight) {
      const sliceHeight = Math.min(pxPageHeight, imgHeight - renderedHeight);
      
      // Create temp canvas for the page slice
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const ctx = pageCanvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas, 
          0, renderedHeight, canvas.width, sliceHeight, 
          0, 0, canvas.width, sliceHeight
        );
        
        const pageData = pageCanvas.toDataURL('image/jpeg', 0.95);
        const slicePdfHeight = sliceHeight * ratio;

        if (pageIndex > 0) {
          pdf.addPage();
        }
        pdf.addImage(pageData, 'JPEG', margin, margin, contentWidth, slicePdfHeight);
      }

      renderedHeight += pxPageHeight;
      pageIndex++;
    }
  }

  // Trigger browser download
  pdf.save(filename);
}
