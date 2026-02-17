const chalk = require('chalk');

module.exports = {
    success: (message) => console.log(chalk.green(`[SUCCESS] ${message}`)),
    error: (message) => console.log(chalk.red(`[ERROR] ${message}`)),
    db: (message) => console.log(chalk.magenta(`[DATABASE] ${message}`)),
};
