import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

import {
  faCheck,
  faCircle,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {
  projectName;
  runs;
  selectedRun;
  workflowRuns;
  jobs;
  selectedJob;

  // Fontawesome icons
  faCheck = faCheck;
  faCircle = faCircle;
  faTimes = faTimes;

  constructor(private http: HttpClient, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.loadProjectRuns(params['project']);
    });
  }

  getRunColor(runResult) {
    if (runResult == "success") {
      return "#28A745";
    } else if (runResult == "failure") {
      return "#CB2431";
    }

    return "#959DA5";
  }

  getRunIcon(runResult) {
    if (runResult == "success") {
      return faCheck;
    } else if (runResult == "failure") {
      return faTimes;
    }

    return faCircle;
  }

  getDate(date: string) {
    let date1 = new Date(date);
    return new Intl.DateTimeFormat('default', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      minute: 'numeric',
      hour: 'numeric'
    }).format(date1);
  }
  
  async deselectRun() {
    this.selectedRun = null;
    this.jobs = null;
  }

  loadProjectRuns(repositoryName) {
    this.projectName = repositoryName;
    const baseUrl = 'https://api.github.com/repos/ByMartrixx/' + this.projectName;

    // Request action runs
    this.http.jsonp(baseUrl + '/actions/runs', 'callback').subscribe(data => {
      this.runs = data["data"];
      this.workflowRuns = this.runs.workflow_runs;
      
      this.route.params.subscribe(params => {
        var run = params['run'];

        if (run == "latest") {
          this.loadRun(0);
        } else if (run != undefined) {
          this.loadRun(this.runs['total_count'] - run);
        }
      });
    });
  }

  loadRun(run) {
    let count = this.runs['total_count'];

    if (count == null) {
      return;
    }

    this.selectedRun = this.workflowRuns[ run ];
    if (this.selectedRun == null) {
      return;
    }
    
    this.http.jsonp(this.selectedRun.jobs_url, 'callback').subscribe(data => {
      try { // TODO: Select job method
        this.jobs = data["data"]["jobs"];
      } catch {
        this.jobs = null;
      }
    });
  }

}
