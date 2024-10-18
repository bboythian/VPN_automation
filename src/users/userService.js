class UserService {
    constructor(instance, apiUrl) {
        this.instance = instance;
        this.apiUrl = apiUrl;
    }

    async createUser(sid, username, password) {
        try {
            const response = await this.instance.post(`${this.apiUrl}/add-user`, {
                name: username,
                password: password,
                "expiration-date": '2025-12-31',
                "authentication-method": "INTERNAL_PASSWORD",
                "groups": ["Funcionario"]
            }, { headers: { 'X-chkp-sid': sid } });
            console.log(`Usuario ${username} creado exitosamente.`);
            return response.data.uid;
        } catch (error) {
            if (error.response) {
                console.error('Error al crear el usuario:', error.response.data);  // Más detalles del error
            } else {
                console.error('Error al crear el usuario:', error.message);
            }
            throw error;
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

    async userExists(sid, username) {
        try {
            const response = await this.instance.post(`${this.apiUrl}/show-users`, { limit: 50, "details-level": "full" }, { headers: { 'X-chkp-sid': sid } });
            return response.data.objects.some(user => user.name === username);
        } catch (error) {
            console.error('Error al verificar si el usuario existe:', error.message);
            throw error;
        }
    }
}

module.exports = UserService;
