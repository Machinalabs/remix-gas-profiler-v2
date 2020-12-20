const LOG = process.env.REACT_APP_LOGS_ENABLED || false

export const log = (...args: any) => {
    if (LOG) console.log(args)
}
