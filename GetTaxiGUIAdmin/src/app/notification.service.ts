import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  showNotification({title, body}:{title:string, body:string}) {
    let notifContainer = document.getElementById('notification-container');
    let notifDiv = this.createNotifDiv(title);
    let [notifTitle, notifBody] = this.createNotifInner(title, body);
    let notifBtn = this.createNotifCloseBtn(notifDiv);
    notifContainer?.appendChild(notifDiv)
    notifDiv?.appendChild(notifTitle)
    notifDiv?.appendChild(notifBody)
    notifDiv?.appendChild(notifBtn)
    
    setTimeout(() => {
      notifDiv.remove()
    }, 3500)
  }
  private createNotifDiv(title: string): Element {
    let notificationDiv = document.createElement('div');
    notificationDiv.classList.add(...['notification', title.toLowerCase()]);
    return notificationDiv;
  }
  private createNotifInner(title: string, body: string): Array<Element> {
    let notificationTitle = document.createElement('h3');
    notificationTitle.classList.add('title');
    notificationTitle.innerText = title;
    let notificationBody = document.createElement('p');
    notificationBody.classList.add('body');
    notificationBody.innerText = body;
    return [notificationTitle, notificationBody];
  }
  private createNotifCloseBtn(notifDiv: Element): Element {
    let notifBtn = document.createElement('i');
    notifBtn.classList.add(...['fa', 'fa-times', 'btn']);
    notifBtn.addEventListener("click", (event) => {
      notifDiv.remove()
    })
    return notifBtn;
  }
}
