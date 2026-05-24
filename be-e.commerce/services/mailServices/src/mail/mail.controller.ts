// mail.controller.ts
import {
  Controller,
  Post,
  Body,
  Logger,
  Get,
  HttpException,
} from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { MailService } from "./mail.service";
import {
  VerifyEmailInterface,
  ResetPasswordEmailInterface,
  LoginInterface,
  SellerAcccountVerificationInterface,
} from "./interfaces/mail.interface";
import { MailHealthService } from "./mail.health";

@Controller()
export class MailController {
  private readonly logger = new Logger(MailController.name);

  constructor(
    private readonly mailService: MailService,
    private readonly mailHealthService: MailHealthService,
  ) {}

  // ─── VERIFY EMAIL ─────────────────────────────────────────
  /** Test thủ công qua Postman */
  @Post("test/verify-email")
  async testVerifyEmail(@Body() data: VerifyEmailInterface) {
    this.logger.log(`[TEST] verify email: ${data.email}`);
    return this.mailService.sendVerificationEmail(data);
  }

  /** Production - nhận từ RabbitMQ */
  @EventPattern("send_verification_email")
  async handleVerificationEmail(@Payload() data: VerifyEmailInterface) {
    this.logger.log(`[EVENT] verify email: ${data.email}`);
    await this.mailService.sendVerificationEmail(data);
  }

  // ─── RESET PASSWORD ───────────────────────────────────────
  /** Test thủ công qua Postman */
  @Post("test/reset-password")
  async testResetPassword(@Body() data: ResetPasswordEmailInterface) {
    this.logger.log(`[TEST] reset password: ${data.email}`);
    return this.mailService.sendResetPasswordEmail(data);
  }

  /** Production - nhận từ RabbitMQ */
  @EventPattern("send_reset_password_email")
  async handleResetPasswordEmail(@Payload() data: ResetPasswordEmailInterface) {
    this.logger.log(`[EVENT] reset password: ${data.email}`);
    await this.mailService.sendResetPasswordEmail(data);
  }

  // ─── LOGIN NOTIFICATION ───────────────────────────────────
  /** Test thủ công qua Postman */
  @Post("test/login-notification")
  async testLoginNotification(@Body() data: LoginInterface) {
    this.logger.log(`[TEST] login notification: ${data.email}`);
    return this.mailService.sendLoginNotificationEmail(data);
  }

  /** Production - nhận từ RabbitMQ */
  @EventPattern("send_login_notification_email")
  async handleLoginNotificationEmail(@Payload() data: LoginInterface) {
    this.logger.log(`[EVENT] login notification: ${data.email}`);
    await this.mailService.sendLoginNotificationEmail(data);
  }

  @Post("test/seller-account-verification")
  async testSellerAccountVerification(
    @Body() data: SellerAcccountVerificationInterface,
  ) {
    this.logger.log(`[TEST] seller account verification: ${data.email}`);
    return this.mailService.sendSellerAccountVerificationEmail(data);
  }

  @EventPattern("send_seller_account_verification_email")
  async handleSellerAccountVerificationEmail(
    @Payload() data: SellerAcccountVerificationInterface,
  ) {
    this.logger.log(`[EVENT] seller account verification: ${data.email}`);
    await this.mailService.sendSellerAccountVerificationEmail(data);
  }

  @Post("test/send-admin-mail")
  async testSendAdminMail(@Body() data: any) {
    this.logger.log(`[TEST] send admin mail: ${data.email}`);
    return this.mailService.sendAdminAccountEmail(data);
  }

  @EventPattern("send_admin_account_email")
  async handleAdminAccountEmail(@Payload() data: any) {
    this.logger.log(`[EVENT] send admin mail: ${data.email}`);
    await this.mailService.sendAdminAccountEmail(data);
  }

  // ─── HEALTH ───────────────────────────────────────────────
  @Get("health")
  async checkHealth() {
    const result = await this.mailHealthService.check();
    if (result.status !== "OK") {
      throw new HttpException(result, 503);
    }
    return result;
  }
}
