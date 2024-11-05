const fs = require('fs');
const path = require('path');
const CommandExecutor = require('../utils/commandExecutor');

class CertificateService {
    async ensureCertsDirectory() {
        const certsDir = path.resolve('./certs');
        if (!fs.existsSync(certsDir)) {
            fs.mkdirSync(certsDir);
            console.log(`Directorio ${certsDir} creado.`);
        }
    }
    async generatePrivateKey(username) {
        await this.ensureCertsDirectory();  // Asegura que el directorio certs exista

        const keyPath = path.resolve(`./certs/${username}key.pem`);
        const command = `openssl genrsa -out "${keyPath}" 2048`;
        await CommandExecutor.execCommand(command);
        return keyPath;
    }

    async generateCSR(username, keyPath) {
        const csrPath = path.resolve(`./certs/${username}csr.pem`);
        const command = `openssl req -new -key "${keyPath}" -out "${csrPath}" -subj "/CN=${username}"`;
        // console.log('Generando CSR...');
        await CommandExecutor.execCommand(command);
        return csrPath;
    }

    async generateCertificate(username, keyPath, csrPath, days) {
        const certPath = path.resolve(`./certs/${username}cert.pem`);
        const command = `openssl x509 -req -days ${days} -in "${csrPath}" -signkey "${keyPath}" -out "${certPath}"`;
        console.log(`Generando certificado válido por ${days} días...`);
        await CommandExecutor.execCommand(command);
        return certPath;
    }

    async generateP12(username, keyPath, certPath) {
        const outputP12 = path.resolve(`./certs/${username}.p12`);
        const command = `openssl pkcs12 -export -inkey "${keyPath}" -in "${certPath}" -out "${outputP12}" -name "${username}" -passout pass:yourpassword`;
        console.log('Generando .p12...');
        await CommandExecutor.execCommand(command);
        return outputP12;
    }
    
    async convertP12ToPem(p12Path) {
        const outputPem = p12Path.replace('.p12', '.pem');
        const command = `openssl pkcs12 -in "${p12Path}" -out "${outputPem}" -clcerts -nokeys -passin pass:yourpassword`;
        console.log('Convirtiendo .p12 a .pem...');
        await CommandExecutor.execCommand(command);
        return outputPem;
    }
}

module.exports = CertificateService;
