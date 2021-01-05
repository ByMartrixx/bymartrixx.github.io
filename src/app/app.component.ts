import { Component } from '@angular/core';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { Octokit } from '@octokit/rest';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'bymartrixx';

  // Fontawesome icons
  faBars = faBars;
  faGithub = faGithub;

  public menuCollapsed = true;

  static octokit = new Octokit({
    userAgent: 'bymartrixx-github-io',
    log: {
      debug: () => {
        if (!environment.production) {
          console.debug
        }
      },
      info: () => {
        if (!environment.production) {
          console.info
        }
      },
      warn: console.warn,
      error: console.error
    }
  });

  static getDurationFromMS(millis: number): string {
    let seconds = Math.floor(millis / 1000);
    return this.getDurationFromS(seconds);
  }

  static getDurationFromS(seconds: number): string {
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    let totalSeconds = seconds % 60;
    let totalMinutes = minutes % 60;

    let str = '';

    if (hours > 0) {
      str += hours + 'h ';
    }
    if (totalMinutes > 0) {
      str += totalMinutes + 'm ';
    }
    if (totalSeconds > 0) {
      str += totalSeconds + 's ';
    }
    if (str == '') {
      str = '0s';
    }

    return str.trim();
  }
}
