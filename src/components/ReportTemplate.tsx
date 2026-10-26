import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  X, 
  FileText, 
  Code, 
  Copy, 
  Check, 
  FileCheck, 
  Calculator, 
  ShieldCheck, 
  FlaskConical,
  Layers,
  Calendar,
  CheckCircle2
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
  const [viewMode, setViewMode] = useState<'document' | 'raw'>('document');
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

  const formattedDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()).replace(' ', '. ');
  const hasMeasurements = measurements && measurements.length > 0;
  const numAnalytes = hasMeasurements ? (measurements[0]?.analytes?.length || 0) : analytes.length;

  const replicateStats = hasMeasurements ? Array.from({ length: numAnalytes }).map((_, aIdx) => {
    const analyteName = measurements[0]?.analytes?.[aIdx]?.name || `Analyte ${aIdx + 1}`;
    const validPurities = measurements.map(m => m.results[aIdx]?.purity).filter(p => typeof p === 'number') as number[];
    if (validPurities.length === 0) return null;
    const sum = validPurities.reduce((a, b) => a + b, 0);
    const mean = sum / validPurities.length;
    const variance = validPurities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (validPurities.length > 1 ? validPurities.length - 1 : 1);
    const stdDev = Math.sqrt(variance);
    const rsd = mean !== 0 ? (stdDev / mean) * 100 : 0;
    return { analyteName, mean, stdDev, rsd, count: validPurities.length };
  }).filter(Boolean) : [];

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
            className={`cursor-pointer flex items-center gap-2 text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-lg transition-colors border ${isDraggingPdf ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 border-dashed text-blue-600 dark:text-blue-400 shadow-xs' : 'bg-white hover:bg-slate-50 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 shadow-xs'}`}
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
            <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400" /> 
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
      
      {/* Main Report Container */}
      <div className="flex-1 flex flex-col space-y-4 max-w-5xl mx-auto w-full">
        {/* Document Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/80 p-3 sm:px-4 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">qNMR Analytical Report</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Standard analytical report preview (custom logo will be rendered exclusively in the exported PDF)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="inline-flex items-center p-0.5 bg-slate-200/70 dark:bg-slate-700 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setViewMode('document')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${viewMode === 'document' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <FileText className="w-3.5 h-3.5" /> Document View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('raw')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${viewMode === 'raw' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <Code className="w-3.5 h-3.5" /> Raw Text (.txt)
              </button>
            </div>

            {/* Action Buttons */}
            <button 
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 px-3.5 py-1.5 rounded-lg shadow-xs transition-colors font-medium border border-slate-300 dark:border-slate-600 cursor-pointer"
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

        {/* View Mode 1: Document Sheet Preview */}
        {viewMode === 'document' ? (
          <div 
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-10 text-slate-800 dark:text-slate-100 transition-colors"
            style={{ fontFamily: "'Aptos', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
          >
            {/* Document Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold tracking-wider uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
                  <FlaskConical className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Certificate of Analysis · 1H-qNMR Assay
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white pt-1">
                  qNMR Analytical Report
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Quantitative 1H-NMR Internal Standard Method · Compliant with GUM / Eurachem ISO 17025
                </p>
              </div>

              {/* Metadata Badge Box */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">Date of Report</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{formattedDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">Deuterated Solvent</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{globalDeuteratedSolvent || 'Chloroform-d'}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">Analytical Mode</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{hasMeasurements ? `${measurements.length} Measurements` : `${analytes.length} Component(s)`}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">Uncertainty Model</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">GUM Gaussian (k=1)</span>
                </div>
              </div>
            </div>

            {/* Section 1: Reference Standard Information */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-800 dark:text-slate-200">
                  Reference Standard (Internal Standard)
                </h3>
              </div>
              
              <div className="border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden bg-white dark:bg-slate-800/40 shadow-2xs">
                <div className="bg-slate-50/80 dark:bg-slate-800/90 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Standard Compound:</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{reference.name || 'Unknown Standard'}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Chemical Shift (δ): <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{reference.chemicalShift ? `${reference.chemicalShift} ppm` : 'N/A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-700/80 text-xs">
                  <div className="p-3 space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 block">Supplier & Batch</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{reference.supplier || 'N/A'}</p>
                    <p className="text-[11px] text-slate-400 truncate">Lot: {reference.batchCode || 'N/A'}</p>
                  </div>
                  <div className="p-3 space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 block">Certified Purity (P_ref)</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {reference.purity || '100'} %
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">u: ±{reference.purityError || '0.1'}%</p>
                  </div>
                  <div className="p-3 space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 block">Weighed Mass (m_ref)</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {reference.mass || '—'} mg
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">M: {reference.molarMass || '—'} g/mol</p>
                  </div>
                  <div className="p-3 space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 block">Peak Integration (I_ref)</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {reference.integral || '—'}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">Protons (N): {reference.protons || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Analyte Sample Information & Determined Purity */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-800 dark:text-slate-200">
                    Sample Information & Quantitative Results
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {hasMeasurements ? `${measurements.length} Determinations` : 'Single Session'}
                </span>
              </div>

              {hasMeasurements ? (
                // Multi-Measurement View
                <div className="space-y-6">
                  {measurements.map((m, mIdx) => (
                    <div key={m.id || mIdx} className="border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 sm:p-5 bg-white dark:bg-slate-800/30">
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                          Measurement {mIdx + 1}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          Standard: {m.reference.name} ({m.reference.mass} mg)
                        </span>
                      </div>

                      <div className="space-y-4">
                        {m.analytes.map((analyte, idx) => {
                          const result = m.results[idx];
                          const label = getAnalyteLabel(analyte, idx, m.analytes);
                          return (
                            <div key={idx} className="bg-slate-50/70 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                    {label}
                                  </span>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                    {analyte.name || 'Unknown API'}
                                  </h4>
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                  δ {analyte.chemicalShift || 'N/A'} ppm · {analyte.protons}H · {analyte.molarMass} g/mol
                                </span>
                              </div>

                              {/* Quantitative Result Highlight */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900/80 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 items-center">
                                <div className="sm:col-span-2">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                                    Determined {analyte.isSolvent ? 'Residual Content' : 'Purity / Assay (w/w)'}
                                  </span>
                                  <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-400 tabular-nums">
                                      {result?.purity != null ? result.purity.toFixed(2) : '0.00'} %
                                    </span>
                                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                      ± {result?.absoluteError != null ? result.absoluteError.toFixed(4) : '0.0000'} %
                                    </span>
                                    {result?.relativeError != null && (
                                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                        RSD {result.relativeError.toFixed(2)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 sm:pl-3 pt-2 sm:pt-0">
                                  <span>Sample Mass: <strong className="font-mono text-slate-800 dark:text-slate-200">{analyte.mass || '—'} mg</strong></span><br />
                                  <span>Peak Area: <strong className="font-mono text-slate-800 dark:text-slate-200">{analyte.integral || '—'}</strong></span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Single Active Session View
                <div className="space-y-4">
                  {analytes.map((analyte, idx) => {
                    const result = results[idx];
                    const label = getAnalyteLabel(analyte, idx, analytes);
                    return (
                      <div key={idx} className="border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 bg-white dark:bg-slate-800/40 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-700/80">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {label}
                            </span>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">
                              {analyte.name || 'Unknown Sample'}
                            </h4>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span>Peak Shift: <strong className="font-mono text-slate-800 dark:text-slate-200">{analyte.chemicalShift ? `${analyte.chemicalShift} ppm` : 'N/A'}</strong></span>
                            <span>Protons: <strong className="font-mono text-slate-800 dark:text-slate-200">{analyte.protons}H</strong></span>
                          </div>
                        </div>

                        {/* Parameter Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Molar Mass (M_x)</span>
                            <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{analyte.molarMass || '—'} g/mol</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Weighed Mass (m_x)</span>
                            <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{analyte.mass || '—'} mg</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Integrated Protons (N_x)</span>
                            <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{analyte.protons || '—'}</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Peak Area (I_x)</span>
                            <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{analyte.integral || '—'}</span>
                          </div>
                        </div>

                        {/* Elevated Purity Summary Hero Box */}
                        <div className="bg-gradient-to-r from-blue-50/70 via-sky-50/50 to-indigo-50/70 dark:from-blue-950/30 dark:via-slate-800/40 dark:to-indigo-950/30 p-4 sm:p-5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              Calculated {analyte.isSolvent ? 'Content' : 'Purity / Assay (w/w)'}
                            </span>
                            <div className="flex items-baseline gap-3 mt-1">
                              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-blue-900 dark:text-blue-100 tabular-nums">
                                {result?.purity != null ? result.purity.toFixed(2) : '0.00'} %
                              </span>
                              <span className="text-sm font-mono text-blue-700 dark:text-blue-300 font-medium">
                                ± {result?.absoluteError != null ? result.absoluteError.toFixed(4) : '0.0000'} %
                              </span>
                              {result?.relativeError != null && (
                                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                                  RSD: {result.relativeError.toFixed(2)}%
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-xs text-slate-600 dark:text-slate-300 border-t sm:border-t-0 sm:border-l border-blue-200 dark:border-blue-900/60 sm:pl-4 pt-2 sm:pt-0 max-w-sm">
                            <span className="italic leading-relaxed block">
                              The {analyte.isSolvent ? 'calculated content' : 'purity'} of <strong>{analyte.name || 'Unknown'}</strong> was determined to be <strong>{result?.purity != null ? result.purity.toFixed(2) : '0.00'}% (±{result?.absoluteError != null ? result.absoluteError.toFixed(4) : '0.0000'}%)</strong> using {reference.name || 'Unknown Standard'} as an internal standard.
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 3: Replicate Precision Statistics (if measurements exist) */}
            {hasMeasurements && replicateStats.length > 0 && (
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-800 dark:text-slate-200">
                    Replicate Precision & Statistical Summary
                  </h3>
                </div>

                <div className="border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden bg-white dark:bg-slate-800/40">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-2.5">Component</th>
                        <th className="px-4 py-2.5">Determinations (n)</th>
                        <th className="px-4 py-2.5">Mean Purity (w/w)</th>
                        <th className="px-4 py-2.5">Std. Deviation (±s)</th>
                        <th className="px-4 py-2.5">RSD (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/80 font-mono">
                      {replicateStats.map((stat, sIdx) => (
                        <tr key={sIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3 font-sans font-bold text-slate-900 dark:text-white">
                            {stat?.analyteName}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                            n = {stat?.count}
                          </td>
                          <td className="px-4 py-3 text-blue-700 dark:text-blue-400 font-bold">
                            {stat?.mean.toFixed(2)} %
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            ±{stat?.stdDev.toFixed(4)} %
                          </td>
                          <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-bold">
                            {stat?.rsd.toFixed(2)} %
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section 4: Governing qNMR Equation */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                  Mathematical Model & Ratio Formula
                </h3>
              </div>

              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
                <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 overflow-x-auto py-2">
                  <span className="font-bold text-red-600 dark:text-red-400">P<sub className="text-[10px]">Sample</sub></span>
                  <span>=</span>
                  <div className="inline-flex flex-col items-center justify-center text-center px-1">
                    <span className="border-b border-slate-400 dark:border-slate-500 pb-0.5">I<sub className="text-[10px]">Sample</sub></span>
                    <span className="pt-0.5">I<sub className="text-[10px]">Ref</sub></span>
                  </div>
                  <span>·</span>
                  <div className="inline-flex flex-col items-center justify-center text-center px-1">
                    <span className="border-b border-slate-400 dark:border-slate-500 pb-0.5">N<sub className="text-[10px]">Ref</sub></span>
                    <span className="pt-0.5">N<sub className="text-[10px]">Sample</sub></span>
                  </div>
                  <span>·</span>
                  <div className="inline-flex flex-col items-center justify-center text-center px-1">
                    <span className="border-b border-slate-400 dark:border-slate-500 pb-0.5">M<sub className="text-[10px]">Sample</sub></span>
                    <span className="pt-0.5">M<sub className="text-[10px]">Ref</sub></span>
                  </div>
                  <span>·</span>
                  <div className="inline-flex flex-col items-center justify-center text-center px-1">
                    <span className="border-b border-slate-400 dark:border-slate-500 pb-0.5">m<sub className="text-[10px]">Ref</sub></span>
                    <span className="pt-0.5">m<sub className="text-[10px]">Sample</sub></span>
                  </div>
                  <span>·</span>
                  <span className="font-bold">P<sub className="text-[10px]">Ref</sub></span>
                </div>

                <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400 text-right leading-relaxed max-w-xs">
                  Where <em>I</em> = integral, <em>N</em> = protons, <em>M</em> = molar mass (g/mol), <em>m</em> = mass (mg), <em>P</em> = purity (%).
                </div>
              </div>
            </div>

            {/* Section 5: Document Approvals & Sign-Off */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600 dark:text-slate-400">
                <div className="space-y-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Analytical Chemist / Performed By</span>
                  <div className="border-b border-slate-300 dark:border-slate-700 h-8 flex items-end">
                    <span className="text-slate-400 italic text-[11px]">Signature: __________________________</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Date: {formattedDate}</span>
                    <span>Status: Completed</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Quality Reviewer / Approved By</span>
                  <div className="border-b border-slate-300 dark:border-slate-700 h-8 flex items-end">
                    <span className="text-slate-400 italic text-[11px]">Signature: __________________________</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Date: ____________________</span>
                    <span>Review: GxP Compliant</span>
                  </div>
                </div>
              </div>

              {/* Informational preview note */}
              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Remix qNMR Calculator · Electronic Record Generation</span>
                <span>Custom logo is embedded in exported PDF document</span>
              </div>
            </div>
          </div>
        ) : (
          /* View Mode 2: Raw Text (.txt) View */
          <div className="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-slate-700 text-xs text-slate-300 font-mono">
              <span className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                qNMR_Report_{analytes[0]?.name ? analytes[0].name.trim() : 'Sample'}.txt
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs transition-colors cursor-pointer"
                title="Copy raw text report to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-5 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto whitespace-pre selection:bg-blue-600/40">
              {generateReport()}
            </pre>
          </div>
        )}
      </div>
    </>
  );
}
