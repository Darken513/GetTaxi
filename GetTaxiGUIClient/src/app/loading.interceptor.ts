import { Injectable } from '@angular/core';
import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
    timer:number = 0;
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
                    this.close()
                }
            })
        );
    }

    close(){
        setTimeout(() => {
            if(this.timer + 500 > (new Date().getTime())){
                this.close()
                return;
            }
            document.getElementById("loading-container")!.style!.display = "none";
        }, 500);
    }
}
