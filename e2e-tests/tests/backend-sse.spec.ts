import { test, expect } from '@playwright/test';
import * as http from 'http';

test.describe('Backend API Tests', () => {
  test('SSE Endpoint should return 200, correct headers, and stream metrics', async () => {
    return new Promise<void>((resolve, reject) => {
      const req = http.get('http://localhost:3001/api/system-metrics', (res) => {
        try {
          // Verify headers
          expect(res.statusCode).toBe(200);
          expect(res.headers['content-type']).toContain('text/event-stream');
          expect(res.headers['cache-control']).toBe('no-cache');
          expect(res.headers['connection']).toBe('keep-alive');
        } catch(e) {
          reject(e);
        }
        
        let dataStr = '';
        res.on('data', (chunk) => {
          dataStr += chunk.toString();
          
          if (dataStr.includes('event: metrics') && dataStr.includes('data:')) {
            const lines = dataStr.split('\n');
            const dataLine = lines.find(line => line.startsWith('data: '));
            if (dataLine) {
              try {
                const payload = JSON.parse(dataLine.replace('data: ', ''));
                
                // Validate schema payload
                expect(typeof payload.monitors).toBe('number', 'monitors must be a number');
                expect(payload.ram).toBeDefined();
                expect(typeof payload.ram.total).toBe('number', 'ram.total must be a number');
                expect(payload.cpuUsage).toBeDefined();
                expect(typeof payload.cpuUsage.currentLoad).toBe('number', 'cpuUsage.currentLoad must be a number');
                expect(payload.networkUsage).toBeDefined();
                
                res.destroy(); // stop receiving stream
                resolve();
              } catch (err) {
                res.destroy();
                reject(err);
              }
            }
          }
        });

        res.on('error', reject);
      });

      req.on('error', reject);
      
      // Timeout if event stream takes too long
      setTimeout(() => {
        req.destroy();
        reject(new Error('Timeout waiting for SSE event: Stream took over 20000ms.'));
      }, 20000);
    });
  });
});
