import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  X, 
  Code, 
  Copy, 
  Check
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import { Compound, QNMRResult, SavedCalculationSession } from '../types';
import { LOGO_BASE64 } from '../lib/logoBase64';

interface ReportTemplateProps {
  analytes: Compound[];
  reference: Compound;
  results: (QNMRResult | null)[];
  globalDeuteratedSolvent?: string;
  measurements?: SavedCalculationSession[];
  logo?: string;
  logoScale?: number;
  onOpenLogoModal?: () => void;
}

const DEFAULT_TEMPLATE = `qNMR Analytical Report
======================
Date: {{date}}
Measured in: {{deuterated_solvent}}

Reference Standard Information
------------------------------
Standard: {{ref_name}}
Chem. Shift: {{ref_chem_shift}} ppm
Supplier: {{ref_supplier}}
Batch Code: {{ref_batch_code}}
Internal Code: {{ref_internal_code}}
Molar Mass: {{ref_ref_molar_mass}} g/mol
Sample Mass: {{ref_mass}} mg
Standard Purity: {{ref_purity}}%
Integrated Protons: {{ref_protons}}
Integral Area: {{ref_integral}}

{{analyte_sections}}
{{measurements_section}}
`;

export default function ReportTemplate({ 
  analytes, 
  reference, 
  results, 
  globalDeuteratedSolvent, 
  measurements,
  logo,
  logoScale,
  onOpenLogoModal
}: ReportTemplateProps) {
  const template = DEFAULT_TEMPLATE;
  const [copied, setCopied] = useState(false);
  const [pdfToMerge, setPdfToMerge] = useState<File | null>(null);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);

  const handleMergeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfToMerge(file);
    } else {
      setPdfToMerge(null);
    }
  };

  const getAnalyteLabel = (analyte: Compound, idx: number, analyteList: Compound[]) => {
    let count = 0;
    for (let i = 0; i <= idx; i++) {
      if (analyteList[i]) {
        if (analyte.isSolvent && analyteList[i].isSolvent) count++;
        if (!analyte.isSolvent && !analyteList[i].isSolvent) count++;
      }
    }
    return analyte.isSolvent ? `Residual Solvent ${count}` : `Analyte ${count}`;
  };

  const generateReport = () => {
    let report = template;
    
    let analyteSections = '';
    
    if (measurements && measurements.length > 0) {
      analyteSections = measurements.map((m, mIdx) => {
        let sections = m.analytes.map((analyte, idx) => {
          const result = m.results[idx];
          return `Sample Information (${getAnalyteLabel(analyte, idx, m.analytes)})
------------------
Name: ${analyte.name || 'Unknown'}
Chem. Shift: ${analyte.chemicalShift || 'N/A'} ppm
Molar Mass: ${analyte.molarMass} g/mol
Sample Mass: ${analyte.mass} mg
Integrated Protons: ${analyte.protons}
Integral Area: ${analyte.integral}

Result:
The ${analyte.isSolvent ? 'calculated content' : 'purity'} of ${analyte.name || 'Unknown'} was determined to be ${result?.purity != null ? result.purity.toFixed(2) : '0.00'}% (±${result?.absoluteError != null ? result.absoluteError.toFixed(4) : '0.0000'}%) using ${m.reference.name || 'Unknown Standard'} as an internal standard.
`;
        }).join('\n');
        return `Measurement ${mIdx + 1}\n==============\n\n${sections}`;
      }).join('\n');
    } else {
      analyteSections = analytes.map((analyte, idx) => {
        const result = results[idx];
        return `Sample Information (${getAnalyteLabel(analyte, idx, analytes)})
------------------
Name: ${analyte.name || 'Unknown'}
Chem. Shift: ${analyte.chemicalShift || 'N/A'} ppm
Molar Mass: ${analyte.molarMass} g/mol
Sample Mass: ${analyte.mass} mg
Integrated Protons: ${analyte.protons}
Integral Area: ${analyte.integral}

Result:
The ${analyte.isSolvent ? 'calculated content' : 'purity'} of ${analyte.name || 'Unknown'} was determined to be ${result?.purity != null ? result.purity.toFixed(2) : '0.00'}% (±${result?.absoluteError != null ? result.absoluteError.toFixed(4) : '0.0000'}%) using ${reference.name || 'Unknown Standard'} as an internal standard.
`;
      }).join('\n');
    }

    let measurementsSection = '';
    if (measurements && measurements.length > 0) {
      measurementsSection = `Average Purity Calculation
--------------------------\n`;
      const numAnalytes = measurements[0].analytes.length;
      for (let aIdx = 0; aIdx < numAnalytes; aIdx++) {
        const analyteName = measurements[0].analytes[aIdx].name || 'Unknown Analyte';
        const validPurities = measurements.map(m => m.results[aIdx]?.purity).filter(p => typeof p === 'number') as number[];
        
        if (validPurities.length > 0) {
          const sum = validPurities.reduce((a, b) => a + b, 0);
          const mean = sum / validPurities.length;
          const variance = validPurities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (validPurities.length > 1 ? validPurities.length - 1 : 1);
          const stdDev = Math.sqrt(variance);
          const rsd = (stdDev / mean) * 100;
          
          measurementsSection += `${analyteName}:
Measurements:\n`;
          measurements.forEach((m, i) => {
            const purity = m.results[aIdx]?.purity;
            if (typeof purity === 'number') {
              measurementsSection += `  Measurement ${i + 1}: ${purity.toFixed(2)}%\n`;
            }
          });
          measurementsSection += `
Mean Purity: ${mean.toFixed(2)}%
Std Deviation: ±${stdDev.toFixed(4)}%
RSD: ${rsd.toFixed(2)}%\n\n`;
        }
      }
    }

    const dataMap: Record<string, any> = {
      date: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()).replace(' ', '. '),
      ref_name: reference.name || 'Unknown Standard',
      ref_chem_shift: reference.chemicalShift || 'N/A',
      deuterated_solvent: globalDeuteratedSolvent || 'N/A',
      ref_integral: reference.integral,
      ref_protons: reference.protons,
      ref_mass: reference.mass,
      ref_ref_molar_mass: reference.molarMass,
      ref_purity: reference.purity || 100,
      ref_supplier: reference.supplier || 'N/A',
      ref_batch_code: reference.batchCode || 'N/A',
      ref_internal_code: reference.internalCode || 'N/A',
      analyte_sections: analyteSections,
      measurements_section: measurementsSection
    };

    report = report.replace(/{{(.*?)}}/g, (match, key) => {
      const trimmedKey = key.trim();
      return dataMap[trimmedKey] !== undefined ? dataMap[trimmedKey] : match;
    });

    return report;
  };

  const handleDownloadPDF = async () => {
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF({ compress: true });
    
    try {
      const activeLogo = logo || LOGO_BASE64;
      const getDimensions = (src: string): Promise<{ width: number; height: number }> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.naturalWidth || 1493, height: img.naturalHeight || 620 });
          img.onerror = () => resolve({ width: 1493, height: 620 });
          img.src = src;
        });
      };

      const { width: origWidth, height: origHeight } = await getDimensions(activeLogo);
      const aspectRatio = origWidth / (origHeight || 1);
      
      const scale = (logoScale || 100) / 100;
      const maxH = 20 * scale;
      const maxW = 65 * scale;
      let imgHeight = maxH;
      let imgWidth = imgHeight * aspectRatio;
      if (imgWidth > maxW) {
        imgWidth = maxW;
        imgHeight = imgWidth / aspectRatio;
      }
      const xPos = 195 - imgWidth;
      const yPosLogo = 14 + (20 - imgHeight) / 2;
      const format = activeLogo.startsWith('data:image/jpeg') || activeLogo.startsWith('data:image/jpg') ? 'JPEG' : 'PNG';
      doc.addImage(activeLogo, format, xPos, yPosLogo, imgWidth, imgHeight);
    } catch (e) {
      console.warn('Could not load logo image for PDF.', e);
    }

    doc.setFont("helvetica", "normal");
    let yPos = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text('qNMR Analytical Report', 15, yPos);
    yPos += 10;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const dateStr = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()).replace(' ', '. ');
    doc.text(`Date: ${dateStr}`, 15, yPos);
    yPos += 7;
    doc.text(`Measured in: ${globalDeuteratedSolvent || 'N/A'}`, 15, yPos);
    yPos += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('Reference Standard Information', 15, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      margin: { left: 15 },
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 11, textColor: 0, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1 },
      bodyStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 55 },
        2: { fontStyle: 'bold', cellWidth: 35 },
        3: { cellWidth: 50 },
      },
      body: [
        ['Standard:', reference.name || '', 'Supplier:', reference.supplier || ''],
        ['Molar Mass:', `${reference.molarMass || ''} g/mol`, 'Batch Code:', reference.batchCode || ''],
        ['Sample Mass:', `${reference.mass || ''} mg`, 'Internal Code:', reference.internalCode || ''],
        ['Integrated Protons:', reference.protons || '', 'Standard Purity:', `${reference.purity || '100'}%`],
        ['Integral Area:', reference.integral || '', 'Chem. Shift:', reference.chemicalShift ? `${reference.chemicalShift} ppm` : 'N/A'],
      ],
      didDrawPage: (data) => {
        if (data.cursor) {
          yPos = data.cursor.y + 15;
        }
      }
    });

    const renderAnalyteBlock = (analyte: Compound, idx: number, result: QNMRResult | null, refStandard: Compound, analyteList: Compound[]) => {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`Sample Information (${getAnalyteLabel(analyte, idx, analyteList)})`, 15, yPos);
      yPos += 5;
      
      doc.setFont("helvetica", "normal");
      doc.text('-----------------', 15, yPos);
      yPos += 6;

      const details = [
        { label: 'Name:', value: analyte.name || '' },
        { label: 'Chem. Shift:', value: analyte.chemicalShift ? `${analyte.chemicalShift} ppm` : 'N/A' },
        { label: 'Molar Mass:', value: `${analyte.molarMass || ''} g/mol` },
        { label: 'Sample Mass:', value: `${analyte.mass || ''} mg` },
        { label: 'Integrated Protons:', value: analyte.protons || '' },
        { label: 'Integral Area:', value: analyte.integral || '' },
      ];

      details.forEach(detail => {
        doc.setFont("helvetica", "bold");
        doc.text(detail.label, 15, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(detail.value.toString(), 55, yPos);
        yPos += 6;
      });
      
      yPos += 2;
      
      const purityVal = result?.purity != null ? result.purity.toFixed(2) : '0.00';
      const errorVal = result?.absoluteError != null ? result.absoluteError.toFixed(4) : '0.0000';
      
      const parts = [
        { text: "Result: ", fontStyle: "bold" },
        { text: `The ${analyte.isSolvent ? 'calculated content' : 'purity'} of ${analyte.name || 'Unknown'} was determined to be `, fontStyle: "normal" },
        { text: `${purityVal}% `, fontStyle: "bold" },
        { text: `(±${errorVal}%) using ${refStandard.name || 'Unknown Standard'} as an internal standard.`, fontStyle: "normal" }
      ];

      let currentX = 15;
      const startX = 15;
      const maxWidth = 180;
      const lineHeight = 6;
      
      parts.forEach(part => {
        doc.setFont("helvetica", part.fontStyle);
        const spaceWidth = doc.getTextWidth(" ");
        const words = part.text.split(' ');
        words.forEach((word, index) => {
          const isLast = index === words.length - 1;
          if (word === '' && isLast) return;
          
          const wordWidth = doc.getTextWidth(word);
          if (currentX + wordWidth > startX + maxWidth && currentX !== startX) {
            currentX = startX;
            yPos += lineHeight;
          }
          if (word !== '') {
            doc.text(word, currentX, yPos);
            currentX += wordWidth;
          }
          if (!isLast) {
            currentX += spaceWidth;
          }
        });
      });
      
      yPos += lineHeight + 6;
    };

    if (measurements && measurements.length > 0) {
      measurements.forEach((m, mIdx) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`Measurement ${mIdx + 1}`, 15, yPos);
        yPos += 5;
        doc.setFont("helvetica", "normal");
        doc.text("==============", 15, yPos);
        yPos += 8;
        
        m.analytes.forEach((analyte, idx) => {
          renderAnalyteBlock(analyte, idx, m.results[idx], m.reference, m.analytes);
        });
      });
    } else {
      analytes.forEach((analyte, idx) => {
        renderAnalyteBlock(analyte, idx, results[idx], reference, analytes);
      });
    }

    if (measurements && measurements.length > 0) {
      if (yPos > 240) { doc.addPage(); yPos = 20; }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Average Purity Calculation", 15, yPos);
      yPos += 5;
      doc.setFont("helvetica", "normal");
      doc.text("--------------------------", 15, yPos);
      yPos += 10;
      
      const numAnalytes = measurements[0].analytes.length;
      for (let aIdx = 0; aIdx < numAnalytes; aIdx++) {
        if (yPos > 260) { doc.addPage(); yPos = 20; }
        
        const analyteName = measurements[0].analytes[aIdx].name || 'Unknown Analyte';
        const validPurities = measurements.map(m => m.results[aIdx]?.purity).filter(p => typeof p === 'number') as number[];
        
        if (validPurities.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.text(`${analyteName}:`, 15, yPos);
          yPos += 7;
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          
          measurements.forEach((m, i) => {
            const purity = m.results[aIdx]?.purity;
            if (typeof purity === 'number') {
              if (yPos > 270) { doc.addPage(); yPos = 20; }
              doc.text(`Measurement ${i + 1}: ${purity.toFixed(2)}%`, 20, yPos);
              yPos += 6;
            }
          });
          
          const sum = validPurities.reduce((a, b) => a + b, 0);
          const mean = sum / validPurities.length;
          const variance = validPurities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (validPurities.length > 1 ? validPurities.length - 1 : 1);
          const stdDev = Math.sqrt(variance);
          const rsd = (stdDev / mean) * 100;
          
          yPos += 3;
          doc.setFont("helvetica", "bold");
          doc.text(`Mean Purity: ${mean.toFixed(2)}%`, 20, yPos);
          yPos += 6;
          doc.setFont("helvetica", "normal");
          doc.text(`Std Deviation: ±${stdDev.toFixed(4)}%`, 20, yPos);
          yPos += 6;
          doc.text(`RSD: ${rsd.toFixed(2)}%`, 20, yPos);
          yPos += 12;
        }
      }
    }

    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos += 5;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Calculation Formula", 15, yPos);
    yPos += 20;

    doc.setFont("helvetica", "italic");
    
    doc.setTextColor(190, 40, 40);
    doc.setFontSize(12);
    doc.text("P", 15, yPos);
    let curX = 15 + doc.getTextWidth("P");
    doc.setFontSize(8);
    doc.text("Sample", curX, yPos + 2);
    curX += doc.getTextWidth("Sample");
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(" = ", curX, yPos);
    curX += doc.getTextWidth(" = ");
    
    doc.setFont("helvetica", "italic");
    
    const drawFraction = (numMain: string, numSub: string, denMain: string, denSub: string, xPos: number, yMiddle: number) => {
       doc.setFontSize(12);
       const numMainW = doc.getTextWidth(numMain);
       doc.setFontSize(8);
       const numSubW = doc.getTextWidth(numSub);
       const numTotW = numMainW + numSubW;
       
       doc.setFontSize(12);
       const denMainW = doc.getTextWidth(denMain);
       doc.setFontSize(8);
       const denSubW = doc.getTextWidth(denSub);
       const denTotW = denMainW + denSubW;
       
       const maxW = Math.max(numTotW, denTotW);
       
       doc.setFontSize(12);
       doc.text(numMain, xPos + (maxW - numTotW)/2, yMiddle - 2.5);
       doc.setFontSize(8);
       doc.text(numSub, xPos + (maxW - numTotW)/2 + numMainW, yMiddle - 1.5);
       
       doc.setFontSize(12);
       doc.text(denMain, xPos + (maxW - denTotW)/2, yMiddle + 4.5);
       doc.setFontSize(8);
       doc.text(denSub, xPos + (maxW - denTotW)/2 + denMainW, yMiddle + 5.5);
       
       doc.setLineWidth(0.3);
       doc.line(xPos, yMiddle + 0.5, xPos + maxW, yMiddle + 0.5);
       
       return maxW;
    };
    
    const drawDot = (xPos: number, yMiddle: number) => {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("·", xPos + 1.5, yMiddle + 1);
        doc.setFont("helvetica", "italic");
        return doc.getTextWidth("·") + 3;
    };
    
    curX += drawFraction("I", "Sample", "I", "Ref", curX, yPos - 1.5) + 2;
    curX += drawDot(curX, yPos - 1.5) + 2;
    
    curX += drawFraction("N", "Ref", "N", "Sample", curX, yPos - 1.5) + 2;
    curX += drawDot(curX, yPos - 1.5) + 2;
    
    curX += drawFraction("M", "Sample", "M", "Ref", curX, yPos - 1.5) + 2;
    curX += drawDot(curX, yPos - 1.5) + 2;
    
    curX += drawFraction("m", "Ref", "m", "Sample", curX, yPos - 1.5) + 2;
    curX += drawDot(curX, yPos - 1.5) + 2;
    
    doc.setFontSize(12);
    doc.text("P", curX, yPos);
    curX += doc.getTextWidth("P");
    doc.setFontSize(8);
    doc.text("Ref", curX, yPos + 2);
    
    yPos += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const legendText = "Where:\nP_Sample = Purity of analyte (%)\nI_Sample = Integral area of analyte\nI_Ref = Integral area of reference\nN_Sample = Number of integrated protons of analyte\nN_Ref = Number of integrated protons of reference\nM_Sample = Molar mass of analyte\nM_Ref = Molar mass of reference\nm_Sample = Sample mass of analyte\nm_Ref = Sample mass of reference\nP_Ref = Purity of reference (%)";
    doc.text(legendText, 15, yPos);

    const sampleName = analytes[0]?.name ? analytes[0].name.trim() : 'Sample';
    
    if (pdfToMerge) {
      try {
        const generatedPdfBytes = doc.output('arraybuffer');
        
        const mergedPdf = await PDFDocument.create();
        
        const pdf1 = await PDFDocument.load(generatedPdfBytes);
        const copiedPages1 = await mergedPdf.copyPages(pdf1, pdf1.getPageIndices());
        copiedPages1.forEach((page) => mergedPdf.addPage(page));
        
        const uploadedPdfBytes = await pdfToMerge.arrayBuffer();
        const pdf2 = await PDFDocument.load(uploadedPdfBytes);
        const copiedPages2 = await mergedPdf.copyPages(pdf2, pdf2.getPageIndices());
        copiedPages2.forEach((page) => mergedPdf.addPage(page));
        
        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        saveAs(blob, `qNMR_Report_${sampleName}_Merged.pdf`);
      } catch (err) {
        console.error("Error fusing PDFs:", err);
        alert("There was an error merging the PDFs. Falling back to the generated report only.");
        doc.save(`qNMR_Report_${sampleName}.pdf`);
      }
    } else {
      doc.save(`qNMR_Report_${sampleName}.pdf`);
    }
  };

  const handleDownload = () => {
    const reportText = generateReport();
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const sampleName = analytes[0]?.name ? analytes[0].name.trim() : 'Sample';
    saveAs(blob, `qNMR_Report_${sampleName}.txt`);
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateReport());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };


  return (
    <>
      {/* Top Utility: Fuse PDF Attachment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-slate-200 dark:border-slate-700/80">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Fuse Supplementary PDF</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">Optional</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Append NMR spectra or external analytical certificates directly to the exported PDF report</span>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            id="pdf-merge-upload" 
            className="hidden" 
            accept="application/pdf"
            onChange={handleMergeUpload}
          />
          <label 
            htmlFor="pdf-merge-upload" 
            className={`cursor-pointer flex items-center gap-2 text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-lg transition-colors shadow-xs ${
              isDraggingPdf 
                ? 'bg-blue-700 border border-dashed border-white text-white' 
                : pdfToMerge 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingPdf(true); }}
            onDragLeave={() => setIsDraggingPdf(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingPdf(false);
              const file = e.dataTransfer.files?.[0];
              if (file && file.type === 'application/pdf') {
                setPdfToMerge(file);
              }
            }}
          >
            <Upload className="w-4 h-4 text-white" /> 
            <span className="truncate max-w-[200px]">{pdfToMerge ? pdfToMerge.name : 'Select or Drop PDF'}</span>
          </label>
          {pdfToMerge && (
            <button 
              onClick={() => setPdfToMerge(null)}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
              title="Remove attached PDF"
              aria-label="Remove attached PDF"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Main Unified Report Window */}
      <div className="flex-1 max-w-5xl mx-auto w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {/* Unified Header & Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 font-mono">
                qNMR_Report_{analytes[0]?.name ? analytes[0].name.trim().replace(/\s+/g, '_') : 'Sample'}.txt
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Standard analytical report in raw text format (custom logo is rendered in the exported PDF)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Action Buttons */}
            <button 
              onClick={handleCopyText}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg shadow-xs transition-colors font-medium border border-slate-300 dark:border-slate-600 cursor-pointer"
              title="Copy raw text report to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button 
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg shadow-xs transition-colors font-medium border border-slate-300 dark:border-slate-600 cursor-pointer"
              title="Download plaintext report"
            >
              <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" /> TXT
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-white font-medium bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Download publication-grade compressed PDF"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        {/* Report Content Body in Light/Dark Theme */}
        <pre className="p-5 font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 leading-relaxed overflow-x-auto whitespace-pre selection:bg-blue-100 dark:selection:bg-blue-900/40">
          {generateReport()}
        </pre>
      </div>
    </>
  );
}
