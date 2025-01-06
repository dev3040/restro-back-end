import { Injectable, NestMiddleware } from '@nestjs/common';
import jwt_decode from "jwt-decode";

@Injectable()
export class JwtMiddleware implements NestMiddleware {

    async use(req, res, next) {

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt_decode(token);
                req.user = decoded; // Attach the decoded user to the request object
                next();
            } catch (error) {
                res.status(401).json({ message: 'Invalid token' });
            }
        } else {
            res.status(401).json({ message: 'Token not provided' });
        }
    }
}
