// @ts-ignore
import Tesseract from 'https://esm.sh/tesseract.js@5.0.5';
// @ts-ignore
import * as pdfjsLib from 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.min.mjs';

// Configure PDF.js worker securely using CDN
// This loads the PDF parsing engine remotely to avoid Vite build/worker injection issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Reads a File (PDF or Image) and attempts to automatically extract biomarker numerals.
 */
export async function processDocumentInBackground(file: File): Promise<Record<string, number> | null> {
  let text = '';

  try {
    if (file.type === 'application/pdf') {
      const buffer = await file.arrayBuffer();
      // Start the PDF parsing
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += (textContent.items as any[]).map(item => item.str).join(' ') + '\n';
      }
      text = fullText;
      
    } else if (file.type.startsWith('image/')) {
      // It's an image. Use Tesseract OCR
      // Automatically uses french and english language models mapped securely to CDN
      const worker = await Tesseract.createWorker('fra+eng', 1, {
        workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/worker.min.js',
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0',
        logger: () => {} // Silent
      });
      // Set Page Segmentation Mode to 6 (Assume a single uniform block of text) to drastically improve tabular tracking
      await worker.setParameters({
        tessedit_pageseg_mode: '6',
      });
      const result = await worker.recognize(file);
      await worker.terminate();
      text = result.data.text;
    } else {
      return null;
    }
    
    // Once we have raw text, run it through the extraction heuristic
    return parseMetricsHeuristic(text);
  } catch (error) {
    console.error('OCR Extraction Failed silently in background:', error);
    return null; // Return null gracefully, don't crash the app.
  }
}

/**
 * A highly adaptive heuristic algorithm to intelligently pluck ANY test name and its value
 * from chaotic messy laboratory layout strings.
 */
function parseMetricsHeuristic(text: string): Record<string, number> {
  const metrics: Record<string, number> = {};
  
  // 1. Destruction of visual artifacts: Medical tables often use dotted lines (.....) to connect names to numbers.
  // We MUST blank these out because Tesseract tries to read them as random letters (like 'woe cus')
  const cleanText = text.replace(/(?:\.|_|-){2,}/g, ' ');
  
  const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Regex to match biological test names up to 5 words, followed by numbers accommodating French spacing "1 440,00"
  const robustPattern = /^([a-zA-ZÀ-ÿ()]+(?:[\s.\-#]+[a-zA-ZÀ-ÿ()]+){0,4})\s+((?:\d{1,3}\s)?\d{1,4}[.,]\d{1,4}|\d{1,5})\s*(?:g\/dl|%|fl|pg|10\^|mg\/l|ui\/l|mmol\/l|µmol\/l|g\/l|\/mm3|µ3)?/i;

  for (const line of lines) {
    const match = line.match(robustPattern);
    
    if (match) {
      let rawName = match[1].trim();
      
      // Clean up French thousands space (1 440) and normalize comma to dot
      const valStr = match[2].replace(/\s/g, '').replace(',', '.');
      const val = parseFloat(valStr);
      
      let lowerName = rawName.toLowerCase();
      
      // Destroy noise symbols like "Lymphocytes #" -> "Lymphocytes"
      lowerName = lowerName.replace(/[#*]/g, '').trim();
      rawName = rawName.replace(/[#*]/g, '').trim();
      
      // Normalize acronyms explicitly so C.C.M.H matches CCMH from previous records perfectly
      if (lowerName.match(/^[a-z]\.[a-z]\.[a-z](\.[a-z])?$/i)) {
         rawName = rawName.replace(/\./g, '').toUpperCase();
      }
      
      // Filter out PDF header/footer general text
      const isNoise = lowerName.length < 2 || 
                      lowerName.includes('soit') || 
                      lowerName.includes('technique') || 
                      lowerName.includes('dossier') || 
                      lowerName.includes('résultats') ||
                      lowerName.includes('valeurs') ||
                      lowerName.includes('age') || 
                      lowerName.includes('editee') ||
                      lowerName.includes('laboratoire') ||
                      lowerName.match(/^[0-9]+$/); // purely numbers

      if (!isNoise && !isNaN(val) && val >= 0 && val < 500000) {
        // Standardize Capitalization for the diagram, but preserve full ALL-CAPS abbreviations (like "VGM")
        let cleanName = rawName;
        if (rawName !== rawName.toUpperCase()) {
            cleanName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
        }

        if (!metrics[cleanName]) {
          metrics[cleanName] = val;
        }
      }
    }
  }

  return Object.keys(metrics).length > 0 ? metrics : {};
}
