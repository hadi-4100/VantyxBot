const chalk = require('chalk');

module.exports = {
    success: (message) => console.log(chalk.green(`[SUCCESS] ${message}`)),
    error: (message) => console.log(chalk.red(`[ERROR] ${message}`)),
    warn: (message) => console.log(chalk.yellow(`[WARN] ${message}`)),
    info: (message) => console.log(chalk.blue(`[INFO] ${message}`)),
    db: (message) => console.log(chalk.magenta(`[DATABASE] ${message}`)),
};
