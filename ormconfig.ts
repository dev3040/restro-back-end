import { config } from "dotenv";
config({ path: `./config/env/${process.env.NODE_ENV}.env` });
export = {
    type: "postgres",
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE_NAME,
    entities: [__dirname + "/../shared/entity/*.entity{.ts,.js}"],
    // entities: ["./src/shared/entity/*.entity{.ts,.js}"],
    seeds: ["./src/db/seeders/**/*{.ts,.js}"],
    factories: ["./src/db/factories/**/*{.ts,.js}"]
};
