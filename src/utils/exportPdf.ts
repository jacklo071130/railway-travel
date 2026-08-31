import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { DayItinerary } from '../types';

/**
 * Triggers direct browser download of a generated PDF file
 */
function downloadPdfBlob(pdf: jsPDF, filename: string): void {
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  try {
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = safeFilename;
    link.setAttribute('download', safeFilename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 3000);
  } catch (err) {
    console.warn('Blob URL download failed, falling back to pdf.save():', err);
    pdf.save(safeFilename);
  }
}

export async function exportElementToPdf(element: HTMLElement, itinerary: DayItinerary): Promise<void> {
  const cleanTitle = (itinerary.title || '台鐵一日遊')
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim();
  const dateStr = itinerary.travelDate || '行程';
  const filename = `${cleanTitle}_AI台鐵一日遊行程表_${dateStr}.pdf`;

  // Locate the offscreen host container if applicable
  const host = document.getElementById('pdf-render-offscreen-host');
  const originalHostStyle = host ? {
    position: host.style.position,
    left: host.style.left,
    top: host.style.top,
    zIndex: host.style.zIndex,
    visibility: host.style.visibility,
    opacity: host.style.opacity,
    display: host.style.display,
  } : null;

  try {
    // Temporarily position host at top-left behind all content with full opacity for crisp rendering
    if (host) {
      host.style.position = 'fixed';
      host.style.left = '0px';
      host.style.top = '0px';
      host.style.zIndex = '-99999';
      host.style.visibility = 'visible';
      host.style.opacity = '1';
      host.style.display = 'block';
    }

    // Wait a brief moment to ensure fonts, icons, and DOM layout are fully settled
    await new Promise((resolve) => setTimeout(resolve, 200));

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
      // Render each pre-formatted A4 page cleanly
      for (let i = 0; i < pageNodes.length; i++) {
        const pageEl = pageNodes[i];

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 794,
          height: 1122,
          scrollX: 0,
          scrollY: 0,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }
    } else {
      // Fallback: If no .pdf-page markers, render entire element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        scrollX: 0,
        scrollY: 0,
      });

      const margin = 6;
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

    // Trigger direct browser download of the valid, high-res PDF file
    downloadPdfBlob(pdf, filename);
  } catch (error) {
    console.error('HTML2Canvas rendering error, using high-fidelity Canvas text fallback:', error);
    
    // Robust Canvas-based UTF-8 Traditional Chinese PDF Generator
    // This avoids jsPDF built-in font encoding issues by rasterizing Chinese via browser Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1588;
    canvas.height = 2244;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0F3A35';
      ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", sans-serif';
      ctx.fillText(itinerary.title || '台鐵深度一日遊行程表', 80, 110);

      ctx.fillStyle = '#1A8F82';
      ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", sans-serif';
      ctx.fillText(`出發日期：${itinerary.travelDate || ''}  |  區間：${itinerary.originStation?.name || ''} ⇄ ${itinerary.destinationStation?.name || ''}`, 80, 160);

      ctx.fillStyle = '#546E6A';
      ctx.font = '22px -apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", sans-serif';
      ctx.fillText(`【行程摘要】${itinerary.summary || ''}`, 80, 210);

      ctx.strokeStyle = '#1A8F82';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(80, 245);
      ctx.lineTo(1508, 245);
      ctx.stroke();

      let yPos = 300;
      itinerary.stops.forEach((stop, idx) => {
        if (yPos > 2100) return;
        ctx.fillStyle = '#0F3A35';
        ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText(`${idx + 1}. [${stop.timeSlot}] ${stop.placeName}（${stop.highlight}）`, 80, yPos);
        yPos += 40;

        ctx.fillStyle = '#546E6A';
        ctx.font = '22px -apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText(`📍 地址：${stop.address}  |  ⏱️ 交通：${stop.transportFromPrevious.durationText}`, 110, yPos);
        yPos += 35;

        if (stop.tips) {
          ctx.fillStyle = '#8C7C20';
          ctx.font = 'italic 20px -apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", sans-serif';
          ctx.fillText(`💡 貼士：${stop.tips}`, 110, yPos);
          yPos += 45;
        } else {
          yPos += 20;
        }
      });

      const fallbackPdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      fallbackPdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      downloadPdfBlob(fallbackPdf, filename);
    }
  } finally {
    // Restore original host styles safely
    if (host && originalHostStyle) {
      host.style.position = originalHostStyle.position;
      host.style.left = originalHostStyle.left;
      host.style.top = originalHostStyle.top;
      host.style.zIndex = originalHostStyle.zIndex;
      host.style.visibility = originalHostStyle.visibility;
      host.style.opacity = originalHostStyle.opacity;
      host.style.display = originalHostStyle.display;
    }
  }
}


