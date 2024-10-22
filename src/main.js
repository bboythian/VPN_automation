const AuthService = require('./auth/authService');
const UserService = require('./users/userService');
const CertificateService = require('./certificates/certificateService');

const authService = new AuthService('https://172.16.5.2/web_api', 'automate', 'Autom8@Centrosur2024!.');
const userService = new UserService(authService.instance, authService.apiUrl);
const certificateService = new CertificateService();

// Función principal para manejar el proceso
async function processRequestPC(username, password, periodo) {
    let sid;
    let result = {
        errorMessage: null,
        status: false,
        path: null,
        username: null,
        password: null
    };

    try {
        // Autenticar sesión
        sid = await authService.login();

        // Intentar crear el usuario
        try {
            await userService.createUser(sid, username, password);
            await authService.publish(sid);
        } catch (error) {
            console.log('Catch error:', error.message); // Log del error
            const errorMessage = error.message;
            // Error de duplicidad
            if (errorMessage.includes("than one object named")) {
                console.log(`Error de duplicidad detectado: ${errorMessage}`);

                // Eliminar el usuario duplicado
                await userService.deleteUser(sid, username);
                await authService.publish(sid);

                try {
                    await userService.createUser(sid, username, password);
                    await authService.publish(sid);
                    result.status = true;
                }
                catch (error) {
                    result.status = false;
                 }

            // Error por longitud de la contraseña
            } else {
                result.errorMessage = error.message || 'Error desconocido al crear el usuario después de eliminar el duplicado';
                return result; // Detener el proceso aquí
            }
        }

        // Generar clave, CSR, y certificado solo si no hubo errores previos
        const keyPath = await certificateService.generatePrivateKey(username);
        const csrPath = await certificateService.generateCSR(username, keyPath);
        const certPath = await certificateService.generateCertificate(username, keyPath, csrPath, periodo);
        const p12Path = await certificateService.generateP12(username, keyPath, certPath);

        // Publicar cambios
        await authService.publish(sid);

        // Si todo salió bien, actualizar resultado
        result.status = true;
        result.path = p12Path;
        result.username = username;
        result.password = password;

    } catch (error) {
        console.error('Error en el proceso:', error.message);
        if (sid) await authService.discard(sid);
        result.errorMessage = error.message;
        result.status = false;
    }

    // Retornar si fue exitoso o no
    return result;
}

// Función para calcular el username y contraseña
function generarCredenciales(nombreCompleto) {
    const nombreArray = nombreCompleto.split(' '); // Dividir el nombre en partes
    const primerNombre = nombreArray[0]; // Primer nombre
    const apellido = nombreArray[2]; // Primer apellido (Toapanta en este caso)

    // Generar username en formato Func_CToapanta
    const username = `Funcionario_${primerNombre}${apellido.charAt(0).toUpperCase()}${apellido.slice(1).toLowerCase()}`;

    // Generar contraseña en formato ctoapanta
    const password = `${primerNombre.charAt(0).toLowerCase()}${apellido.toLowerCase()}`;

    return { username, password };
}

// Parámetros Entrada
const nombre = 'Xavier Christian Toapanta Alvarado';
const tipoDispositivo = 'PC'; //TAB O PC
const periodo = 60; //días
const credenciales = generarCredenciales(nombre);

console.log('Username:', credenciales.username);
console.log('Password:', credenciales.password);
console.log('Periodo:', periodo);

// Main
async function main() {
    let result;
    if (tipoDispositivo === 'TAB') {
        result = await processRequestTAB(credenciales.username, credenciales.password, periodo);
    } else if (tipoDispositivo === 'PC') {
        result = await processRequestPC(credenciales.username, credenciales.password, periodo);
    }

    console.log('Resolve:', result); // Muestra true o false
}

main();
