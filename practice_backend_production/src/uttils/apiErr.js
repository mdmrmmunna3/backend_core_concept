class apiErr extends Error {
    constructor(
        statusCode,
        message = "something went wrong!!",
        errors = [], // optionaly handle
        stack = ""
    ) {
        super(message),
            this.data = null, // defalut value is null
            this.statusCode = statusCode,
            this.message = message,
            this.success = false,
            this.errors = errors
        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { apiErr }