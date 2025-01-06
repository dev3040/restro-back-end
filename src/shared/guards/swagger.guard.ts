import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SwaggerGuard implements CanActivate {
   constructor(private readonly configService: ConfigService) { }

   canActivate(context: ExecutionContext): boolean {

      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Basic ')) {
         throw new UnauthorizedException('Missing or invalid authorization header');
      }

      const base64Credentials = authHeader.split(' ')[1];
      const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = decodedCredentials.split(':');

      //get the username and password from the config file
      const usr = this.configService.get("swagger.username");
      const pswd = this.configService.get("swagger.password");

      //compare the username and password with the values from the config file
      if (username === usr && password === pswd) {
         return true;
      }
      throw new UnauthorizedException('Invalid credentials!');
   }
}
