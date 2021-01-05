import { Component, OnInit } from '@angular/core';
import {
  faArchive,
  faBalanceScale,
  faCircle,
  faCodeBranch,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import colors from '../../assets/colors.json';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  public repositories;

  rateLimited;
  rateLimitReset;
  rateLimitResetTimeRemaining;

  // Fontawesome icons
  faArchive = faArchive;
  faBalanceScale = faBalanceScale;
  faCircle = faCircle;
  faCodeBranch = faCodeBranch;
  faStar = faStar;

  constructor() {}

  async ngOnInit(): Promise<void> {
    const response = await AppComponent.octokit.repos.listForUser({
      username: 'ByMartrixx',
    });
    // TODO: Error handler?

    const rateLimitRemaining = parseInt(
      response.headers['x-ratelimit-remaining']
    );
    this.rateLimitReset = response.headers['x-ratelimit-reset'];

    this.rateLimited = rateLimitRemaining <= 0;
    this.rateLimitResetTimeRemaining =
      this.rateLimitReset - Math.floor(new Date().getTime() / 1000);

    if (!this.rateLimited) {
      this.repositories = response.data;
    }
  }

  getColorForLang(language: string): string {
    if (colors[language] != null) {
      if (colors[language].color == null) {
        return '#F2F2F2';
      } else {
        return colors[language].color;
      }
    } else {
      return '#F2F2F2';
    }
  }

  getDuration(seconds: number): string {
    return AppComponent.getHumanReadableDurationS(seconds);
  }
}
