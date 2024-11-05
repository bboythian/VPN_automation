class UserService {
    constructor(instance, apiUrl) {
        this.instance = instance;
        this.apiUrl = apiUrl;
    }

    async createUser(sid, username, password, fechaFinal) {
        try {
            const response = await this.instance.post(`${this.apiUrl}/add-user`, {
                name: username,
                password: password,
                "expiration-date": fechaFinal,
                "authentication-method": "INTERNAL_PASSWORD",
                "groups": ["Funcionario"]
            }, { headers: { 'X-chkp-sid': sid } });
            console.log(`Usuario ${username}     creado exitosamente, con pass: ${password.substring(0, 8)}`);
            return response.data.uid;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error desconocido al crear el usuario';
            const errorDetails = error.response?.data?.errors || [];  // Obtener detalles de los errores específicos

            console.error('Error al crear el usuario:', errorMessage, errorDetails);

            // Extraer y enviar solo el texto del mensaje de error
            if (errorDetails.length > 0 && errorDetails[0].message) {
                throw new Error(errorDetails[0].message);  // Enviar solo el mensaje sin llaves ni comillas
            } else {
                throw new Error(errorMessage);  // Si no hay detalles, enviar el mensaje general
            }
        }
    }

    async deleteUser(sid, username) {
        try {
            await this.instance.post(`${this.apiUrl}/delete-user`, { name: username }, { headers: { 'X-chkp-sid': sid } });
            console.log(`Usuario ${username} antiguo eliminado exitosamente.`);
        } catch (error) {
            console.error('Error al eliminar el usuario:', error.message);
            throw error;
        }
    }
    async setAuthenticationPassword(sid, username, password) {
        try {
            const response = await this.instance.post(`${this.apiUrl}/set-user`, {
                name: username,
                password: password, 
                "authentication-method": "INTERNAL_PASSWORD"
            }, { headers: { 'X-chkp-sid': sid } });
            console.log(`Contraseña de autenticación establecida exitosamente para el usuario ${username}.`);
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error desconocido al establecer la contraseña';
            console.error(`Error al establecer la contraseña de autenticación para el usuario ${username}:`, errorMessage);
            throw new Error(errorMessage);
        }
    }

}

module.exports = UserService;
