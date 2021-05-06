module.exports = class ServiceError extends Error {
    /**
     * @param {String} code Un code interne d'identification de l'erreur
     * @param {Error} originalError Erreur originelle
     */
    constructor(code, originalError) {
        super(originalError.message, originalError.fileName, originalError.lineNumber);

        this.code = code;
        this.originalError = originalError;
    }
};
