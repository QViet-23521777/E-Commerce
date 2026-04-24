// src/mail/mail.controller.ts
import { Controller, Post, Body, Logger } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { MailService } from "./mail.service";
import {
  VerifyEmailInterface,
  ResetPasswordEmailInterface,
  LoginInterface,
} from "./interfaces/mail.interface";

@Controller()
export class MailController {
  private readonly logger = new Logger(MailController.name);

  constructor(private readonly mailService: MailService) {}

  @Post("verify-email")
  async testVerifyEmail(@Body() data: VerifyEmailInterface) {
    console.log("data received:", JSON.stringify(data));
    return this.mailService.sendVerificationEmail(data);
  }

  @Post("reset-password")
  async testResetPassword(@Body() data: ResetPasswordEmailInterface) {
    return this.mailService.sendResetPasswordEmail(data);
  }

  @EventPattern("send_verification_email")
  async handleVerificationEmail(
    @Payload() data: VerifyEmailInterface,
  ): Promise<void> {
    this.logger.log("data received:", JSON.stringify(data));
    this.logger.log(`Received verify email event for: ${data.email}`);
    await this.mailService.sendVerificationEmail(data);
  }

  @EventPattern("send_reset_password_email")
  async handleResetPasswordEmail(
    @Payload() data: ResetPasswordEmailInterface,
  ): Promise<void> {
    this.logger.log("data received:", JSON.stringify(data));
    this.logger.log(`Received reset password event for: ${data.email}`);
    await this.mailService.sendResetPasswordEmail(data);
  }

  @Post("send_login_notification_email")
  async handleLoginNotificationEmail(
    @Payload() data: LoginInterface,
  ): Promise<void> {
    this.logger.log("data received:", JSON.stringify(data));
    this.logger.log(`Received login notification event for: ${data.email}`);
    await this.mailService.sendLoginNotificationEmail(data);
  }
}
