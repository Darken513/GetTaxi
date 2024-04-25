import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DriverService } from '../driver.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-verification-screen',
  templateUrl: './verification-screen.component.html',
  styleUrls: ['./verification-screen.component.scss']
})
export class VerificationScreenComponent {
  public defaultFieldName = "verificationCodeField";
  public finalText: string = 'XXXX';
  @Input() driverId: string = "";
  @Input() driver: any; //todo-P3 : use modals

  @Output() update: EventEmitter<any> = new EventEmitter();

  public subs: Array<Subscription> = []; //todo-P3 : make sure to unsbscribe !

  constructor(
    public driverService: DriverService,
    public notificationService: NotificationService,
    public router: Router
  ) {
    //todo-P1: a good idea could be saving a temporary code in the server, the code lasts say 5 minutes
    //then it gets cleared unless the used clicks on resend, the code wont be sent automatically
    //when the user submits the code we check with this code(server) if valid update driver "verifiedPhoneNbr"
  }

  onFieldChange(id: number, event: any) {
    this.finalText = this.setCharAt(this.finalText, id, event.data);
    (document.getElementById('verificationCodeField' + id)! as any).value = event.data;
    if (id < 3) {
      (document.getElementById('verificationCodeField' + (id + 1))! as any).focus();
    } else {
      (document.getElementById('verificationCodeField' + id)! as any).blur();
    }
  }

  setCharAt(str: string, index: number, chr: string) {
    if (index > str.length - 1) return str;
    return str.substring(0, index) + chr + str.substring(index + 1);
  }
}