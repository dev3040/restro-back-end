import { NestFactory } from "@nestjs/core";
import compression from "compression";
import { json } from "body-parser";
import { AppModule } from "./app.module";
import helmet from "helmet";
import { SwaggerModule } from "@nestjs/swagger";
import { SwaggerConfig } from "./config/swagger.config";
import { ReqResInterceptor } from "./shared/interceptors/req-res.intercepter";
import { ForbiddenException, ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import { AllHttpExceptionFilter } from "./exceptions/all-exceptions.filter";
import { IoAdapter } from "@nestjs/platform-socket.io";


async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.use(helmet({ contentSecurityPolicy: true }));

    const configService = app.get<ConfigService>(ConfigService);

    const whiteList = configService.get("server.origin");

    app.enableCors({
        origin: function (origin, callback) {
            if (!origin || whiteList.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new ForbiddenException("Not allowed by CORS"));
            }
        },
        methods: "GET,PUT,PATCH,POST,DELETE",
        credentials: true
    });

    app.use(json({ limit: "15mb" }));
    app.use(compression());

    app.setGlobalPrefix("v1");
    const cookieSecret = configService.get("cookie_secret.secret");
    app.use(cookieParser(cookieSecret));

    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalInterceptors(new ReqResInterceptor());
    app.useGlobalFilters(new AllHttpExceptionFilter());

    const document = SwaggerModule.createDocument(app, SwaggerConfig);

    /*  app.use('/api', (req, res, next) => {
         
         const guard = new SwaggerGuard(configService);
         try {
             guard.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);
             next();
         } catch (err: unknown) {
             const status = (err as any)?.getStatus?.() || 401;
             const message = (err as any)?.message || 'Unauthorized access';
 
             res.setHeader('WWW-Authenticate', 'Basic realm="Swagger"');
             res.status(status).send(message);
         }
     });*/

    SwaggerModule.setup('api', app, document);

    const httpServer = app.getHttpServer();

    const ioAdapter = new IoAdapter(httpServer);
    app.useWebSocketAdapter(ioAdapter);

    const serverPort = configService.get("server.port");
    await app.listen(serverPort);
}

bootstrap();
