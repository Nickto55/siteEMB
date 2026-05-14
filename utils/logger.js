const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LEVELS = {
    DEBUG: { value: 0, color: '\x1b[36m', label: 'DEBUG' },      // Cyan
    INFO:  { value: 1, color: '\x1b[32m', label: 'INFO'  },      // Green
    WARN:  { value: 2, color: '\x1b[33m', label: 'WARN'  },      // Yellow
    ERROR: { value: 3, color: '\x1b[31m', label: 'ERROR' },      // Red
    FATAL: { value: 4, color: '\x1b[35m', label: 'FATAL' }       // Magenta
};

const RESET = '\x1b[0m';
const DIM = '\x1b[2m';

function getCurrentLevel() {
    const envLevel = (process.env.LOG_LEVEL || 'INFO').toUpperCase();
    return LEVELS[envLevel] ? LEVELS[envLevel].value : LEVELS.INFO.value;
}

function getTimestamp() {
    const now = new Date();
    return now.toISOString();
}

function getDateString() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

function formatMessage(level, message, meta = {}) {
    const ts = getTimestamp();
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
        try {
            metaStr = ' | ' + JSON.stringify(meta);
        } catch {
            metaStr = ' | [object]';
        }
    }
    return `[${ts}] [${level.label}] ${message}${metaStr}`;
}

function writeToFile(level, plainMessage) {
    try {
        const dateStr = getDateString();
        const fileName = `${dateStr}-${level.label.toLowerCase()}.log`;
        const filePath = path.join(LOG_DIR, fileName);
        const combinedFile = path.join(LOG_DIR, `${dateStr}-combined.log`);

        const line = plainMessage + '\n';
        fs.appendFileSync(filePath, line);
        fs.appendFileSync(combinedFile, line);
    } catch (err) {
        // Silent fail for file writing
    }
}

function log(levelKey, message, meta = {}) {
    const level = LEVELS[levelKey];
    if (!level) return;

    const currentLevel = getCurrentLevel();
    if (level.value < currentLevel) return;

    const plain = formatMessage(level, message, meta);
    const colored = `${DIM}[${getTimestamp()}]${RESET} ${level.color}[${level.label}]${RESET} ${message}`;

    // Console output
    if (level.value >= LEVELS.ERROR.value) {
        console.error(colored);
        if (meta.error && meta.error.stack) {
            console.error(meta.error.stack);
        }
    } else if (level.value >= LEVELS.WARN.value) {
        console.warn(colored);
    } else {
        console.log(colored);
    }

    // File output
    writeToFile(level, plain);
}

class Logger {
    constructor(context = '') {
        this.context = context ? `[${context}] ` : '';
    }

    debug(message, meta) {
        log('DEBUG', this.context + message, meta);
    }

    info(message, meta) {
        log('INFO', this.context + message, meta);
    }

    warn(message, meta) {
        log('WARN', this.context + message, meta);
    }

    error(message, meta) {
        log('ERROR', this.context + message, meta);
    }

    fatal(message, meta) {
        log('FATAL', this.context + message, meta);
    }

    // Express middleware for request logging
    static requestLogger(req, res, next) {
        const start = Date.now();
        const reqId = Math.random().toString(36).substring(2, 10);

        res.on('finish', () => {
            const duration = Date.now() - start;
            const level = res.statusCode >= 500 ? 'ERROR' : (res.statusCode >= 400 ? 'WARN' : 'INFO');
            const message = `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`;
            const meta = {
                reqId,
                method: req.method,
                path: req.path,
                status: res.statusCode,
                duration,
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent')
            };
            log(level, message, meta);
        });

        next();
    }

    // Express error logging middleware
    static errorLogger(err, req, res, next) {
        log('ERROR', `Unhandled error on ${req.method} ${req.path}`, {
            error: err,
            message: err.message,
            stack: err.stack,
            ip: req.ip || req.connection.remoteAddress
        });
        next(err);
    }
}

// Simple module-level logger instance
const defaultLogger = new Logger();

module.exports = {
    Logger,
    logger: defaultLogger,
    debug: (...args) => defaultLogger.debug(...args),
    info: (...args) => defaultLogger.info(...args),
    warn: (...args) => defaultLogger.warn(...args),
    error: (...args) => defaultLogger.error(...args),
    fatal: (...args) => defaultLogger.fatal(...args)
};
