import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

import {
  faCheck,
  faCircle,
  faExclamationCircle,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {
  projectName;
  runs; // /repos{/user}{/repo}/action/runs
  workflowRuns; // this.runs.workflow_runs
  selectedRun; // this.workflowRuns[n]
  jobCount; // </repos{/user}{/repo}/action/runs{/run_id}/jobs>.total_count
  jobs; // </repos{/user}{/repo}/action/runs{/run_id}/jobs>.jobs
  selectedJob; // this.jobs[o]
  selectedJobNum; // (^) o
  steps; // this.selectedJob.steps

  // Fontawesome icons
  faCheck = faCheck;
  faCircle = faCircle;
  faExclamationCircle = faExclamationCircle;
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
    } else if (runResult == "cancelled") {
      return faExclamationCircle;
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

  getDuration(dateStart: string, dateEnd: string) {
    let millis = new Date(dateEnd).getTime() - new Date(dateStart).getTime();
    let seconds = Math.floor(millis / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    let totalSeconds = seconds % 60;
    let totalMinutes = minutes % 60;

    let str = "";

    if (hours > 0) {
      str += hours + "h ";
    }
    if (totalMinutes > 0) {
      str += totalMinutes + "m ";
    }
    if (totalSeconds > 0) {
      str += totalSeconds + "s ";
    }
    if (str == "") {
      str = "0s";
    }

    return str.trim();
  }
  
  async deselectRun() {
    this.selectedRun = null;
    this.jobs = null;
    this.selectedJob = null;
    this.selectedJobNum = 1;
    this.steps = null;
  }

  async deselectJob() {
    this.selectedJob = null;
    this.selectedJobNum = 1;
    this.steps = null;
  }

  loadProjectRuns(repositoryName) {
    this.deselectRun();

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
    this.deselectRun();

    let count = this.runs['total_count'];

    if (count == null || count == 0) {
      return;
    }

    this.selectedRun = this.workflowRuns[ run ];
    if (this.selectedRun == null) {
      return;
    }
    
    this.http.jsonp(this.selectedRun.jobs_url, 'callback').subscribe(data => {
      try {
        this.jobCount = data["data"]["total_count"];
        this.jobs = data["data"]["jobs"];
      } catch {
        this.jobCount = 0;
        this.jobs = null;
      }

      this.loadJob(0);
    });

    try {
      window.scrollTo(0, document.getElementById("build-info").offsetWidth);
    } catch (error) {}
  }

  loadJob(job) {
    this.deselectJob();

    if (this.jobCount == 0) {
      return;
    }

    this.selectedJob = this.jobs[ job ];
    if (this.selectedJob == null) {
      return;
    }
    this.selectedJobNum = job + 1;
    this.steps = this.selectedJob.steps;
  }

}
