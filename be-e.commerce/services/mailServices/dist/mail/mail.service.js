"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const mailer_1 = require("@nestjs-modules/mailer");
const config_1 = require("@nestjs/config");
let MailService = MailService_1 = class MailService {
    constructor(mailerService, configService) {
        this.mailerService = mailerService;
        this.configService = configService;
        this.logger = new common_1.Logger(MailService_1.name);
    }
    async sendVerificationEmail(data) {
        console.log("data received:", data);
        try {
            await this.mailerService.sendMail({
                to: data.email,
                subject: "Verify Your Account",
                template: "./verify-email",
                context: {
                    name: data.name,
                    verifyUrl: data.verifyUrl,
                },
            });
            this.logger.log(`Verification email sent to ${data.email} + " " + ${data.verifyUrl}`);
            return { success: true, message: "Verification email sent successfully" };
        }
        catch (error) {
            this.logger.error(`Failed: ${error.message}`);
            return { success: false, message: "Failed to send verification email" };
        }
    }
    async sendResetPasswordEmail(data) {
        try {
            const expiredAt = new Date(data.expiredAt).toLocaleString();
            const otp = data.otp;
            await this.mailerService.sendMail({
                to: data.email,
                subject: "Reset Your Password",
                template: "./reset-password",
                context: {
                    name: data.name,
                    otp,
                    expiredAt,
                },
            });
            this.logger.log(`Reset password email sent to ${data.email}` +
                " " +
                otp +
                " " +
                expiredAt);
            return {
                success: true,
                message: "Reset password email sent successfully",
            };
        }
        catch (error) {
            this.logger.error(`Failed to send reset password email to ${data.email}: ${error.message}`);
            return { success: false, message: "Failed to send reset password email" };
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService,
        config_1.ConfigService])
], MailService);
