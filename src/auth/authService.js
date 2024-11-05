const axios = require('axios');
const https = require('https');

class AuthService {
    constructor(apiUrl, user, password) {
        this.apiUrl = apiUrl;
        this.user = user;
        this.password = password;
        this.instance = axios.create({
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });
    }

    async login() {
        try {
            const response = await this.instance.post(`${this.apiUrl}/login`, { user: this.user, password: this.password });
            console.log('Sesión autenticada correctamente.');
            return response.data.sid;
        } catch (error) {
            console.error('Error en la autenticación:', error.message);
            throw error;
        }
    }

    async logout(sid) {
        try {
            await this.instance.post(`${this.apiUrl}/logout`, {}, { headers: { 'X-chkp-sid': sid } });
            console.log('Sesión cerrada correctamente.');
        } catch (error) {
            console.error('Error al cerrar sesión:', error.message);
        }
    }

    async publish(sid) {
        try {
            const response = await this.instance.post(`${this.apiUrl}/publish`, {}, { headers: { 'X-chkp-sid': sid } });
            // console.log('Cambios publicados correctamente.');
            return response.data;
        } catch (error) {
            console.error('Error al publicar los cambios:', error.message);
            throw error;
        }
    }

    async discard(sid) {
        try {
            await this.instance.post(`${this.apiUrl}/discard`, {}, { headers: { 'X-chkp-sid': sid } });
            console.log('Cambios descartados correctamente.');
        } catch (error) {
            console.error('Error al descartar los cambios:', error.message);
        }
    }
}

module.exports = AuthService;
