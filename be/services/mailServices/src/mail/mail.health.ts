import { Injectable } from "@nestjs/common";
import { MailService } from "./mail.service";

@Injectable()
export class MailHealthService {
  constructor(private readonly mailService: MailService) {}
  async check() {
    const mailOk = await this.mailService.ping();
    const status = mailOk ? "ok" : "error";
    return {
      service: "mailServices",
      status,
      timestamp: new Date().toISOString(),
      checks: {
        smtp: mailOk ? "OK" : "FAIL",
      },
    };
  }
}
