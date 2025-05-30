import "dotenv/config";

const {
    REDIS_HOST,
    REDIS_PORT,
    REDIS_PASSWORD,

    USER_EMAIL,
    USER_PASSWORD
} = process.env;

export const env = {
    USER_EMAIL, USER_PASSWORD,
    REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
}