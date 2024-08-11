import {Injectable} from '@angular/core';
import {createClient} from '@supabase/supabase-js';

@Injectable({providedIn: 'root'})
export class SupabaseService {
  private supabaseUrl = 'https://qpwqrxrcfuokylbocluf.supabase.co';
  private supabaseKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwd3FyeHJjZnVva3lsYm9jbHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE4OTMxMzIsImV4cCI6MjAzNzQ2OTEzMn0.YnITf1rlU-7mkfYtz0QqGFZxSMTVeNvMZHTJsPD0rSo';
  public supabase = createClient(this.supabaseUrl, this.supabaseKey);

  constructor() {}
}
