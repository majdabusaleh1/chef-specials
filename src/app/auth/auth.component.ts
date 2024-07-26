import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'auth-app',
  templateUrl: './auth.component.html',
})
export class AuthComponent {
  isLoginMode = true;
  isLoading = false;
  error: string = null;

  constructor(private authService: AuthService, private router: Router) {}

  onSwitchMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  async onSubmit(form: NgForm) {
    if (!form.valid) {
      return;
    }

    const email = form.value.email;
    const password = form.value.password;

    this.isLoading = true;

    try {
      if (this.isLoginMode) {
        await this.authService.login(email, password);
      } else {
        await this.authService.signup(email, password);
      }
      this.router.navigate(['/recipes']);
    } catch (errorMessage) {
      this.error = errorMessage;
    }

    this.isLoading = false;
    form.reset();
  }
}
