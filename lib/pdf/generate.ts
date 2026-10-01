import puppeteer, { Protocol } from 'puppeteer';

export async function generateReportPdf(url: string, cookies: Protocol.Network.CookieParam[]): Promise<Buffer> {
  const executablePath = process.env.CHROME_BIN || (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : undefined);
  
  const browser = await puppeteer.launch({
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  });

  try {
    const page = await browser.newPage();
    
    // Set authentication cookies
    if (cookies && cookies.length > 0) {
      await page.setCookie(...(cookies as any[]));
    }
    
    // Set viewport to A4 size (approximate)
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    
    // Go to the report page
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Enforce print media
    await page.emulateMediaType('print');
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
