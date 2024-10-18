const { exec } = require('child_process');

class CommandExecutor {
    static execCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('Error:', stderr);
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }
}

module.exports = CommandExecutor;
