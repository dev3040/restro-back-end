export const configuration = () => ({
    server: {
        env: process.env.NODE_ENV,
        port: parseInt(process.env.PORT),
        origin: JSON.parse(process.env.WHITELIST),
    },

    db: {
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT),
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASS,
        database: process.env.DATABASE_NAME,
        synchronize: process.env.DATABASE_SYNC == "true",
        logging: process.env.DATABASE_LOG == "true",
        cache: process.env.DATABASE_CACHE == "true"
    },

    jwt: {
        expire_in: parseInt(process.env.JWT_EXPIRE_IN),
        secret: process.env.JWT_SECRET_KEY
    },

    refresh_token: {
        expire_in: parseInt(process.env.REFRESH_TOKEN_EXPIRE_IN),
        secret: process.env.REFRESH_TOKEN_SECRET_KEY
    },

    cookie_secret: {
        secret: process.env.COOKIE_SECRET
    },

    email: {
        host: process.env.EMAIL_HOST || "localhost",
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        port: parseInt(process.env.EMAIL_PORT) || 3000,
        secure: process.env.EMAIL_SECURE == "true"
    },

    aws_s3: {
        access_key_id: process.env.AWS_ACCESS_KEY_ID,
        secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
        private_bucket_name: process.env.AWS_PRIVATE_BUCKET_NAME
    },

    app: {
        forgot_password_email_valid_till: parseInt(process.env.FORGOT_PASSWORD_EMAIL_VALID_TILL),
        super_admin_web_url: process.env.SUPER_ADMIN_WEB_URL,
        doc_url: process.env.DOC_URL,
        frontend_base_url: process.env.FRONTEND_BASE_URL,
        admin_base_url: process.env.ADMIN_BASE_URL,
        otp: {
            expire_time: parseInt(process.env.OTP_EXPIRE_TIME),
            enabled: process.env.OTP_ENABLED == "true"
        }
    },
    fcm: {
        server_key: process.env.FCM_SERVER_KEY
    },
    fed_ex: {
        client_id: process.env.FEDEX_CLIENT_ID,
        client_secret: process.env.FED_EX_CLIENT_SECRET,
        account_number: process.env.FED_EX_ACCOUNT_NUMBER,
        host: process.env.FED_EX_HOST
    },
    fed_ex_tracking: {
        client_id: process.env.TRACK_FEDEX_CLIENT_ID,
        client_secret: process.env.TRACK_FED_EX_CLIENT_SECRET,
        account_number: process.env.TRACK_FED_EX_ACCOUNT_NUMBER,
        host: process.env.TRACK_FED_EX_HOST
    },
    swagger: {
        username: process.env.SWAGGER_USERNAME,
        password: process.env.SWAGGER_PASSWORD
    }

});
