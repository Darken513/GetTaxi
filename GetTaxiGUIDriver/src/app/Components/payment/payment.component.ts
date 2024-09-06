import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/Services/auth.service';
import { NotificationService } from 'src/app/Services/notification.service';

declare var Stripe: any; // Add this line to declare Stripe

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent {
  private stripe: any;
  private elements: any;
  private card: any;
  private driverId: any;
  public amount: number = 20; // Default amount in CHF
  public credits: number = this.amount; // Default credits
  public disabled: boolean = false;

  constructor(private http: HttpClient, private authService: AuthService, private notificationService: NotificationService, private router: Router) { }

  async ngOnInit() {
    this.driverId = this.authService.getDriverIdFromToken();
    this.stripe = await Stripe('pk_test_51J2cDGBTir5a9QP9NchXnP4Pj3rYOhZJJAiZF1bL2NxdGuZJwHGLswyhr1SbiUD3ygDD16LaqpHZBLP6a3qVmeUg00gz4A1f6d'); // Your publishable key
    this.elements = this.stripe.elements();
    this.card = this.elements.create('card');
    this.card.mount('#card-element');
  }

  updateAmount(newAmount: any) {
    this.amount = newAmount.target.value;
    this.credits = newAmount.target.value;
  }
  public redirectToProfile() {
    this.router.navigate([`/driver/profile/`]);
  }
  async handleSubmit(event: Event) {
    event.preventDefault();
    const { token, error } = await this.stripe.createToken(this.card);

    if (error) {
      console.error(error);
    } else {
      this.http.post('http://localhost:8080/driver/payment/' + this.driverId, { token: token.id, amount: this.amount, driverId: this.driverId })
        .subscribe(
          async (response: any) => {
            if (response.requires_action) {
              const { error: confirmError } = await this.stripe.handleCardAction(response.payment_intent_client_secret);
              if (confirmError) {
                this.notificationService.showNotification({ type: 'error', title: 'error', body: '3D Secure/SCA verification failed' })
              } else {
                this.http.post('http://localhost:8080/driver/confirm-payment/' + this.driverId, { paymentIntentId: response.payment_intent_id, driverId: this.driverId, amount: this.amount })
                  .subscribe((confirmResponse: any) => {
                    if (confirmResponse.success) {
                      this.notificationService.showNotification({ type: 'success', title: 'success', body: 'Payment successful ' + confirmResponse });
                      this.disabled = true;
                      setTimeout(() => {
                        this.router.navigate(['/driver/profile']);
                      }, 2000);
                    } else {
                      this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Payment failed after 3D Secure/SCA' })
                    }
                  });
              }
            } else if (response.success) {
              this.notificationService.showNotification({ type: 'success', title: 'success', body: 'Payment successful' });
              this.disabled = true;
              setTimeout(() => {
                this.router.navigate(['/driver/profile']);
              }, 2000);
            } else {
              this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Payment failed ' + response.error })
            }
          },
          (error) => {
            this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error processing payment' })
          }
        );
    }
  }
}