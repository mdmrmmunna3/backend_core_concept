// create a wrapper function to simplify error handling in Express async route handlers. 
const asyncHandlerr = (requestHandeler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandeler(req, res, next)).catch((err) => next(err))
    }
}

export { asyncHandlerr }