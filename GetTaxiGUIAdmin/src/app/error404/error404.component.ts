import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-error404',
  templateUrl: './error404.component.html',
  styleUrls: ['./error404.component.scss']
})
export class Error404Component {
  redirect: boolean = false;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.redirect = this.route.snapshot.data['redirect'];
  }
  redirectToHome() {
    this.router.navigate(['/admin/home']); // Update this with the actual home route
  }
}
