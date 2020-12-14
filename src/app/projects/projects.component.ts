import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  faArchive,
  faBalanceScale,
  faCircle,
  faCodeBranch,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import colors from '../../assets/colors.json';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  public repositories;

  // Fontawesome icons
  faArchive = faArchive;
  faBalanceScale = faBalanceScale;
  faCircle = faCircle;
  faCodeBranch = faCodeBranch;
  faStar = faStar;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // TODO: use http.get instead of http.jsonp
    this.http
      .jsonp('https://api.github.com/users/ByMartrixx/repos', 'callback')
      .pipe(catchError(this.handleError))
      .subscribe((data) => {
        this.repositories = data['data'];
      });
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(
        `Github API returned code ${error.status}, ` +
          `message was: ${error.error.message}`
      );
    }

    return throwError('Something bad happened; please try again later.');
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
}
