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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MailController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const mail_service_1 = require("./mail.service");
let MailController = MailController_1 = class MailController {
    constructor(mailService) {
        this.mailService = mailService;
        this.logger = new common_1.Logger(MailController_1.name);
    }
    async testVerifyEmail(data) {
        console.log("data received:", JSON.stringify(data));
        return this.mailService.sendVerificationEmail(data);
    }
    async testResetPassword(data) {
        return this.mailService.sendResetPasswordEmail(data);
    }
    async handleVerificationEmail(data) {
        this.logger.log("data received:", JSON.stringify(data));
        this.logger.log(`Received verify email event for: ${data.email}`);
        await this.mailService.sendVerificationEmail(data);
    }
    async handleResetPasswordEmail(data) {
        this.logger.log(`Received reset password event for: ${data.email}`);
        await this.mailService.sendResetPasswordEmail(data);
    }
};
exports.MailController = MailController;
__decorate([
    (0, common_1.Post)("verify-email"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "testVerifyEmail", null);
__decorate([
    (0, common_1.Post)("reset-password"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "testResetPassword", null);
__decorate([
    (0, microservices_1.EventPattern)("send_verification_email"),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "handleVerificationEmail", null);
__decorate([
    (0, microservices_1.EventPattern)("send_reset_password_email"),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "handleResetPasswordEmail", null);
exports.MailController = MailController = MailController_1 = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [mail_service_1.MailService])
], MailController);
