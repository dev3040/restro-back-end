import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { throwException } from 'src/shared/utility/throw-exception';

@Injectable()
export class FedExService {
    private cachedToken: { token: string; expiresAt: number };
    private cachedTrackingToken: { token: string; expiresAt: number };

    constructor(private readonly configService: ConfigService) { }


    async getFedExOAuthToken(): Promise<string> {
        try {
            if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
                return this.cachedToken.token;
            }
            const response = await axios.post(
                `${this.configService.get('fed_ex.host')}/oauth/token`,
                new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.configService.get('fed_ex.client_id'),
                    client_secret: this.configService.get('fed_ex.client_secret'),
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            );

            const expiresIn = response.data.expires_in * 1000;
            this.cachedToken = {
                token: response.data.access_token,
                expiresAt: Date.now() + expiresIn - 5000,
            };

            return this.cachedToken.token;
        } catch (error) {
            throwException(error);
        }
    }

    async getFedExOAuthTrackingToken(): Promise<string> {
        try {
            if (this.cachedTrackingToken && this.cachedTrackingToken.expiresAt > Date.now()) {
                return this.cachedTrackingToken.token;
            }
            const response = await axios.post(
                `${this.configService.get('fed_ex_tracking.host')}/oauth/token`,
                new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.configService.get('fed_ex_tracking.client_id'),
                    client_secret: this.configService.get('fed_ex_tracking.client_secret'),
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            );

            const expiresIn = response.data.expires_in * 1000;
            this.cachedTrackingToken = {
                token: response.data.access_token,
                expiresAt: Date.now() + expiresIn - 5000,
            };

            return this.cachedTrackingToken.token;
        } catch (error) {
            throwException(error);
        }
    }
}
