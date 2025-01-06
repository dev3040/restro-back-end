import { DocumentBuilder } from "@nestjs/swagger";

export const SwaggerConfig = new DocumentBuilder()
    .setTitle("Tags & Titles Backend")
    .addBearerAuth()
    .addCookieAuth("auth")
    .setVersion("1.0")
    .addGlobalParameters({ name: "language", description: "Enter language code(ex. en)", example: "en", in: "header" })
    .build();
