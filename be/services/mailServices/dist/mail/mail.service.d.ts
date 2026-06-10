import { MailerService } from "@nestjs-modules/mailer";
import { ConfigService } from "@nestjs/config";
import { VerifyEmailInterface, ResetPasswordEmailInterface, MailResultInterface } from "./interfaces/mail.interface";
export declare class MailService {
    private readonly mailerService;
    private readonly configService;
    private readonly logger;
    constructor(mailerService: MailerService, configService: ConfigService);
    sendVerificationEmail(data: VerifyEmailInterface): Promise<MailResultInterface>;
    sendResetPasswordEmail(data: ResetPasswordEmailInterface): Promise<MailResultInterface>;
}
