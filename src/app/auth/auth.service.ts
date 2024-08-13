import {Injectable} from '@angular/core';
import {BehaviorSubject, throwError} from 'rxjs';
import {SupabaseService} from '../shared/supabase';
import {User} from './user.model';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user = new BehaviorSubject<User>(null);
  private tokenExpirationTimer: any;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

  async signup(email: string, password: string) {
    try {
      const {data, error} = await this.supabaseService.supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data && data.user && data.session) {
        this.handleAuthentication(data.user, data.session.access_token);
        console.log('Signup successful:', data.user);
      }
    } catch (error) {
      this.handleError(error);
      return throwError(this.handleError(error)); // Return the error message to be caught by the component
    }
  }

  async login(email: string, password: string) {
    try {
      const {data, error} =
        await this.supabaseService.supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        throw error;
      }

      if (data && data.session && data.session.user) {
        this.handleAuthentication(data.session.user, data.session.access_token);
        console.log('Login successful:', data.session);
      }
    } catch (error) {
      this.handleError(error);
      return throwError(this.handleError(error)); // Return the error message to be caught by the component
    }
  }

  autoLogin() {
    const userData: {
      email: string;
      id: string;
      _token: string;
      _tokenExpirationDate: string;
    } = JSON.parse(localStorage.getItem('userData'));

    if (!userData) {
      return;
    }

    const loadedUser = new User(
      userData.email,
      userData.id,
      userData._token,
      new Date(userData._tokenExpirationDate)
    );

    if (loadedUser.token) {
      this.user.next(loadedUser);
      const expirationDuration =
        new Date(userData._tokenExpirationDate).getTime() -
        new Date().getTime();
      this.autoLogout(expirationDuration);
    }
  }

  logout() {
    this.user.next(null);
    this.router.navigate(['/auth']);
    localStorage.removeItem('userData');
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = null;
  }

  autoLogout(expirationDuration: number) {
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  private handleAuthentication(authUser, token: string) {
    const expirationDate = new Date(
      new Date().getTime() + 3600 * 1000 // 1 hour token expiration
    );
    const user = new User(authUser.email, authUser.id, token, expirationDate);
    this.user.next(user);
    this.autoLogout(3600 * 1000);
    localStorage.setItem('userData', JSON.stringify(user));
  }

  private handleError(errorRes: any) {
    let errorMessage = 'An unknown error occurred!';
    if (!errorRes || !errorRes.message) {
      return throwError(errorMessage);
    }
    switch (errorRes.message) {
      case 'EMAIL_EXISTS':
        errorMessage = 'This email exists already';
        break;
      case 'EMAIL_NOT_FOUND':
        errorMessage = 'This email does not exist.';
        break;
      case 'INVALID_PASSWORD':
        errorMessage = 'This password is not correct.';
        break;
      case '429':
        errorMessage = 'Too many requests. Please try again later.';
        break;
      default:
        errorMessage = errorRes.message; // Default to the message provided by Supabase
        break;
    }
    return throwError(errorMessage);
  }
}
