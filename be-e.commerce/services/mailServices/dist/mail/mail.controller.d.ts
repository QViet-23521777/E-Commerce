import { MailService } from "./mail.service";
import { VerifyEmailInterface, ResetPasswordEmailInterface } from "./interfaces/mail.interface";
export declare class MailController {
    private readonly mailService;
    private readonly logger;
    constructor(mailService: MailService);
    testVerifyEmail(data: VerifyEmailInterface): Promise<import("./interfaces/mail.interface").MailResultInterface>;
    testResetPassword(data: ResetPasswordEmailInterface): Promise<import("./interfaces/mail.interface").MailResultInterface>;
    handleVerificationEmail(data: VerifyEmailInterface): Promise<void>;
    handleResetPasswordEmail(data: ResetPasswordEmailInterface): Promise<void>;
}
