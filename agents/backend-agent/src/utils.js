import crypto from 'crypto';
import os from 'os';

export class BackendUtils {
  static generateSessionId() {
    return `backend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateServerId() {
    const hostname = os.hostname();
    const serverString = `${hostname}-${Date.now()}`;
    return crypto.createHash('md5').update(serverString).digest('hex').substring(0, 16);
  }

  static getClientIP(req) {
    return req.ip ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.connection?.socket?.remoteAddress ||
           (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0]) ||
           req.headers['x-real-ip'] ||
           'unknown';
  }

  static getMemoryUsage() {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      systemTotal: totalMem,
      systemFree: freeMem,
      systemUsed: totalMem - freeMem,
      systemUsagePercentage: ((totalMem - freeMem) / totalMem) * 100
    };
  }

  static isSuspiciousQuery(query) {
    const suspiciousKeywords = [
      'UNION', 'SELECT', 'DROP', 'DELETE', 'INSERT', 'UPDATE', 
      'EXEC', 'SCRIPT', 'JAVASCRIPT', 'VBSCRIPT'
    ];
    
    const queryUpper = query.toUpperCase();
    return suspiciousKeywords.some(keyword => 
      queryUpper.includes(keyword) && 
      (queryUpper.includes('1=1') || queryUpper.includes('OR') || queryUpper.includes('UNION'))
    );
  }

  static containsXSS(input) {
    const xssIndicators = [
      '<script',
      'javascript:',
      'onclick=',
      'onload=',
      '<iframe',
      'eval(',
      'alert('
    ];
    
    const inputLower = input.toLowerCase();
    return xssIndicators.some(indicator => inputLower.includes(indicator));
  }

  static isRateLimited(ip, requests, maxRequests, timeWindow) {
    const now = Date.now();
    const windowStart = now - timeWindow;
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const ipRequests = requests.get(ip);
    const validRequests = ipRequests.filter(timestamp => timestamp > windowStart);
    
    validRequests.push(now);
    requests.set(ip, validRequests);
    
    return validRequests.length > maxRequests;
  }

  static isSuspiciousUserAgent(userAgent) {
    const suspiciousIndicators = [
      'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python'
    ];
    
    const userAgentLower = userAgent.toLowerCase();
    return suspiciousIndicators.some(indicator => userAgentLower.includes(indicator));
  }
}