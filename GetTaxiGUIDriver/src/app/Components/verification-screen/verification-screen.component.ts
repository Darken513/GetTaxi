import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DriverService } from '../../Services/driver.service';
import { NotificationService } from '../../Services/notification.service';
import { isNumeric, setCharAtStringIndex } from '../../utilities';

const RESEND_TIMER = '30';
const EXPIRATION_TIMER = '120';
const LOADING_STR = 'Loading';
const RESEND_STR = 'Renvoyer';
const DEFAULT_FIELD_NAME = "verificationCodeField";

interface TxtTimerObj {
  txt: string,
  timer: ReturnType<typeof setInterval> | null
}

@Component({
  selector: 'app-verification-screen',
  templateUrl: './verification-screen.component.html',
  styleUrls: ['./verification-screen.component.scss']
})
export class VerificationScreenComponent implements OnInit {

  public defaultFieldName = DEFAULT_FIELD_NAME;
  public finalText: string = 'XXXX';

  public resendObj: TxtTimerObj = {
    txt: RESEND_TIMER,
    timer: null
  }
  public expirationObj: TxtTimerObj = {
    txt: EXPIRATION_TIMER,
    timer: null
  }

  @Input() driverId: string = "";
  @Input() driver: any; //todo-P3 : use modals
  @Output() update: EventEmitter<any> = new EventEmitter();

  public subs: Array<Subscription> = []; //todo-P3 : make sure to unsbscribe !

  constructor(
    public driverService: DriverService,
    public notificationService: NotificationService,
    public router: Router
  ) {
  }

  ngOnInit(): void {
    this.driverService.sendSMSVerificationCode().subscribe({
      next: (value) => {
        this.resetResendObj();
        this.resetExpirationObj();
      },
    })
  }

  resendCode() {
    if (this.resendObj.txt != RESEND_STR && this.resendObj.txt != LOADING_STR)
      return;
    this.resendObj.txt = LOADING_STR;
    this.driverService.sendSMSVerificationCode().subscribe({
      next: (value) => {
        this.resetResendObj();
        this.resetExpirationObj();
      },
    })
  }

  resetResendObj() {
    this.resendObj.txt = RESEND_TIMER;
    clearInterval(this.resendObj.timer!);
    this.resendObj.timer = setInterval(() => {
      if (isNumeric(this.resendObj.txt)) {
        const currentTime = parseInt(this.resendObj.txt);
        this.resendObj.txt = currentTime > 0 ? (currentTime - 1) + '' : RESEND_STR;
      } else {
        clearInterval(this.resendObj.timer!)
      }
    }, 1000)
  }

  resetExpirationObj() {
    this.expirationObj.txt = EXPIRATION_TIMER;
    clearInterval(this.expirationObj.timer!);
    this.expirationObj.timer = setInterval(() => {
      if (isNumeric(this.expirationObj.txt)) {
        const currentTime = parseInt(this.expirationObj.txt);
        this.expirationObj.txt = currentTime > 0 ? (currentTime - 1) + '' : '0';
      } else {
        clearInterval(this.expirationObj.timer!)
      }
    }, 1000)
  }

  verifyCode() {
    this.driverService.verifySMSCode(this.finalText).subscribe({
      next: (val) => {
        if (val.error) {
          this.notificationService.showNotification({
            type: 'error',
            title: 'erreur',
            body: "Le code est soit incorrect, soit expiré. S'il est expiré, demandez un nouveau code."
          });
        } else {
          this.update.emit({ verified: true });
        }
      }
    })
  }

  /**
   * Updates the verification code field based on the user input.
   * @param id - The index of the verification code field.
   * @param event - The event object containing the user input data.
   * @returns void
   */
  onFieldChange(id: number, event: any) {
    if(!isNumeric(event.data))
      return;
    this.finalText = setCharAtStringIndex(this.finalText, id, event.data);
    (document.getElementById(DEFAULT_FIELD_NAME + id)! as any).value = event.data;
    if (id < 3) {
      (document.getElementById(DEFAULT_FIELD_NAME + (id + 1))! as any).focus();
    } else {
      (document.getElementById(DEFAULT_FIELD_NAME + id)! as any).blur();
    }
  }
}