const fs = require('fs');
const path = require('path');

// Logs klasörünü oluştur
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, 'app.log');

function writeLog(level, message, data) {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    const logLine = [${timestamp}] [${level}] ${message}${dataStr};
    
    console.log(logLine); // Konsola yaz
    fs.appendFileSync(logFile, logLine + '\n'); // Dosyaya yaz
}

module.exports = {
    info: (msg, data) => writeLog('INFO', msg, data),
    error: (msg, data) => writeLog('ERROR', msg, data),
    warn: (msg, data) => writeLog('WARN', msg, data),
    logAICall: (type, success, details) => writeLog('AI_CALL', type, { success, ...details }),
    logTicketCreation: (id, userId, title) => writeLog('TICKET_CREATED', Ticket #${id}, { userId, title }),
    logTicketStatusChange: (id, old, neu, by) => writeLog('STATUS_CHANGE', Ticket #${id}, { old, new: neu, by })
};
