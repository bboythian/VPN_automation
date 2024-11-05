const AuthService = require('./auth/authService');
const UserService = require('./users/userService');
const CertificateService = require('./certificates/certificateService');

const authService = new AuthService('https://172.16.5.2/web_api', 'automate', 'Autom8@Centrosur2024!.');
const userService = new UserService(authService.instance, authService.apiUrl);
const certificateService = new CertificateService();

// Función principal para manejar el proceso
async function processRequestPC(username, password, finalDate) {
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
            await userService.createUser(sid, username, password, finalDate);
            await authService.publish(sid);
        } catch (error) {
            // console.log('Catch error:', error.message); // Log del error
            const errorMessage = error.message;
            // Error de duplicidad
            if (errorMessage.includes("More than one object named")) {
                console.log(`Error de duplicidad detectado: ${errorMessage}`);

                // Eliminar el usuario duplicado
                await userService.deleteUser(sid, username);
                await authService.publish(sid);

                try {
                    console.log('Reintento de crear usuario ...');
                    await userService.createUser(sid, username, password, finalDate);
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
        const certPath = await certificateService.generateCertificate(username, keyPath, csrPath, period);
        const p12Path = await certificateService.generateP12(username, keyPath, certPath);

        // Publicar cambios
        await authService.publish(sid);

        // Success
        result.status = true;
        result.path = p12Path;
        result.username = username;
        result.password = password;
        console.log('*** Proceso ejecutado correctamente ***');

    } catch (error) {
        console.error('Error en el proceso:', error.message);
        if (sid) await authService.discard(sid);
        result.errorMessage = error.message;
        result.status = false;
    }

    // Retornar si fue exitoso o no
    return result;
}
async function processRequestTAB(username, password, finalDate) {
    //Completar metodo para generar clave de autentificacion del usuario

    // Método para aplicar la contraseña de autenticación al usuario
    try {
        await userService.setAuthenticationPassword(sid, username, password);
        await authService.publish(sid);
        result.status = true;
    } catch (error) {
        console.error('Error al aplicar contraseña de autenticación:', error.message);
        result.errorMessage = 'Error al aplicar la contraseña de autenticación';
        return result;
    }
}

// Función para calcular el username y contraseña
function generateCredentials(fullName) {
    let result = { errorMessage: null, username: null, password: null };

    try {
        if (!fullName || typeof fullName !== 'string' || fullName.trim().split(' ').length < 3) {
            throw new Error('Nombre inválido: Debe incluir al menos nombre y dos apellidos');
        }
        const nameArray = fullName.trim().split(' ');
        const firstName = nameArray[0];
        const lastName = nameArray[2]; // Primer apellido 

        const username = `Funcionario_${firstName.charAt(0).toUpperCase()}${firstName.slice(1).toLowerCase()}${lastName.charAt(0).toUpperCase()}${lastName.slice(1).toLowerCase()}`;
        const password = `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}`;

        result.username = username;
        result.password = password.substring(0,8);
        // result.password = password.substring(0, 8);

    } catch (error) {
        result.errorMessage = error.message;
    }

    return result;
}



// Función para calcular la fecha final con validación del período
function calculateDateExp(periodDays) {
    let result = { errorMessage: null, finalDate: null };

    try {
        if (isNaN(periodDays) || periodDays <= 0) {
            throw new Error('Período inválido: debe ser un número positivo');
        }

        const fechaActual = new Date();
        fechaActual.setDate(fechaActual.getDate() + periodDays);

        const year = fechaActual.getFullYear();
        const month = String(fechaActual.getMonth() + 1).padStart(2, '0');
        const day = String(fechaActual.getDate()).padStart(2, '0');
        result.finalDate = `${year}-${month}-${day}`;
    } catch (error) {
        result.errorMessage = error.message;
    }

    return result;
}
// Proceso principal
async function main() {
    let result = { errorMessage: null, status: false };
    // Validacion de credenciales correctas
    if (credenciales.errorMessage || dateResult.errorMessage) {
        result.errorMessage = credenciales.errorMessage || dateResult.errorMessage;
        console.log('Resolve:', result);
        return;
    }

    //Seleccion de proceso por dispositivo
    if (deviceType === 'TAB') {
        result = await processRequestTAB(credenciales.username, credenciales.password, dateResult.finalDate);
    } else if (deviceType === 'PC') {
        result = await processRequestPC(credenciales.username, credenciales.password, dateResult.finalDate);
    }

    console.log('Resolve:', result);
}

// Parámetros Entrada
const fullName = 'PEDRO XAVIER ALVARADO RAMIRES';
const deviceType = 'PC'; //TAB O PC
const period = 365; //días

//Calculo de credenciales y fechas
const credenciales = generateCredentials(fullName);
const dateResult = calculateDateExp(period);

if (credenciales.errorMessage) {
    console.error('Error en credenciales:', credenciales.errorMessage);
} else {
    console.log('Username:', credenciales.username);
    console.log('Password:', credenciales.password);
}
if (dateResult.errorMessage) {
    console.error('Error en fecha de expiración:', dateResult.errorMessage);
} else {
    console.log('Fecha de Expiración:', dateResult.finalDate);
    console.log('Periodo:', period, 'días.');
}

main();
