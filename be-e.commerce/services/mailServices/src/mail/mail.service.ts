import { randomInt } from "crypto";
import { Injectable, Logger } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { ConfigService } from "@nestjs/config";
import {
  VerifyEmailInterface,
  ResetPasswordEmailInterface,
  MailResultInterface,
} from "./interfaces/mail.interface";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendVerificationEmail(
    data: VerifyEmailInterface,
  ): Promise<MailResultInterface> {
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

      this.logger.log(
        `Verification email sent to ${data.email} + " " + ${data.verifyUrl}`,
      );
      return { success: true, message: "Verification email sent successfully" };
    } catch (error) {
      this.logger.error(`Failed: ${(error as Error).message}`);
      return { success: false, message: "Failed to send verification email" };
    }
  }

  async sendResetPasswordEmail(
    data: ResetPasswordEmailInterface,
  ): Promise<MailResultInterface> {
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

      this.logger.log(
        `Reset password email sent to ${data.email}` +
          " " +
          otp +
          " " +
          expiredAt,
      );
      return {
        success: true,
        message: "Reset password email sent successfully",
      };
    } catch (error) {
      this.logger.error(
        `Failed to send reset password email to ${data.email}: ${(error as Error).message}`,
      );
      return { success: false, message: "Failed to send reset password email" };
    }
  }
}
