import * as Joi from "joi";

export const validationSchema = Joi.object({
    NODE_ENV: Joi.string().valid("development", "production"),
    SERVER_PORT: Joi.number().default(6001),
    SOCKET_PORT: Joi.number().default(7788),
    WHITELIST: Joi.string().required(),
    DATABASE_HOST: Joi.string().required(),
    DATABASE_PORT: Joi.number().required(),
    DATABASE_USER: Joi.string().required(),
    DATABASE_PASS: Joi.string().required(),
    DATABASE_NAME: Joi.string().required(),
    DATABASE_SYNC: Joi.boolean().required(),
    DATABASE_LOG: Joi.boolean().required(),
    DATABASE_CACHE: Joi.boolean().required(),
    JWT_EXPIRE_IN: Joi.number().default(604800000),
    JWT_SECRET_KEY: Joi.string().required(),
    REFRESH_TOKEN_EXPIRE_IN: Joi.number().default(10000),
    REFRESH_TOKEN_SECRET_KEY: Joi.string().required(),
    FORGOT_PASSWORD_EMAIL_VALID_TILL: Joi.number().default(10000),
    SUPER_ADMIN_WEB_URL: Joi.string().required(),
    EMAIL_HOST: Joi.string().required(),
    EMAIL_USER: Joi.string().required(),
    EMAIL_PASS: Joi.string().required(),
    EMAIL_PORT: Joi.number().default(10000),
    EMAIL_SECURE: Joi.boolean().required(),
    COOKIE_SECRET: Joi.string().required()
});
