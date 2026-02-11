const puppeteer = require('puppeteer');

(async () => {
  try {
    const APP_URL = process.env.APP_URL || 'http://localhost:5173/';
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    const logs = [];
    page.on('console', msg => {
      try {
        const text = msg.text();
        logs.push(text);
      } catch (e) {
        logs.push(String(msg));
      }
    });

    console.log('Opening app at', APP_URL);
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Inject a test sale into localStorage (adds to existing vid_sales)
    const saleId = await page.evaluate(() => {
      try {
        const key = 'vid_sales';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const now = Date.now();
        const sale = {
          id: 's_test_' + now,
          date: new Date().toISOString(),
          items: [{ id: 'p_test_1', name: 'Producto prueba', qty: 1, price: 123.45, cost: 50 }],
          total: 123.45,
          profit: 73.45,
          type: 'venta',
          businessUnit: 'vidrieria',
          metodoPago: 'efectivo',
          bankAccountId: null,
          entregado: true,
          pagado: true,
          payments: [{ id: 'p_test_pay_' + now, amount: 123.45, method: 'efectivo', date: new Date().toISOString() }]
        };
        existing.push(sale);
        localStorage.setItem(key, JSON.stringify(existing));
        return sale.id;
      } catch (e) {
        return null;
      }
    });

    console.log('Injected sale id:', saleId);

    // Navigate explicitly to reportes to ensure dashboard mounts
    try {
      await page.goto(new URL('reportes', APP_URL).toString(), { waitUntil: 'networkidle2', timeout: 60000 });
    } catch (e) {
      // fallback: reload root
      await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    }

    // Wait a bit for app to process and log
    await page.waitForTimeout(4000);

    // Grab a snapshot of vid_sales length and last sale
    const snapshot = await page.evaluate(() => {
      const key = 'vid_sales';
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      return { len: arr.length, last: arr.length ? arr[arr.length-1] : null };
    });

    console.log('LOCALSTORAGE_SNAPSHOT:', JSON.stringify(snapshot, null, 2));

    // Output captured console logs
    console.log('CAPTURED_LOGS_START');
    logs.forEach(l => console.log(l));
    console.log('CAPTURED_LOGS_END');

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Headless test failed:', err);
    process.exit(2);
  }
})();
