import { Inject, Injectable } from '@angular/core';
import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { Router } from '@angular/router';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
    timer: number = 0;
    constructor(
        @Inject(NotificationService) private notificationService: NotificationService,
        private router: Router
    ) { }

    intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        if (req.method === 'POST' || req.method === 'GET' || req.method === 'DELETE') {
            document.getElementById("loading-container")!.style!.display = "block";
            this.timer = (new Date().getTime());
        }
        return next.handle(req).pipe(
            tap((event) => {
                if (event instanceof HttpResponse) {
                    if (event && event.body && event.body.isNotification) {
                        try {
                            this.notificationService.showNotification(event.body)
                        } catch (error) {
                        }
                    } else if (event && event.body && event.body.tokenError) {
                        try {
                            const currentPageUrl = window.location.href;
                            sessionStorage.setItem('currentPageUrl', currentPageUrl);
                            localStorage.removeItem('token');
                            this.router.navigate(['/']);
                        } catch (error) {
                        }
                    }
                    this.close()
                }
            })
        );
    }

    close() {

        setTimeout(() => {
            if (this.timer + 500 > (new Date().getTime())) {
                this.close()
                return;
            }
            document.getElementById("loading-container")!.style!.display = "none";
        }, 500);
    }
}
