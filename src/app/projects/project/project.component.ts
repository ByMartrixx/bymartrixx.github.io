import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { faCircle as farCircle } from '@fortawesome/free-regular-svg-icons';
import {
  faCheck,
  faCircle,
  faExclamation,
  faExclamationCircle,
  faMinusCircle,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { AppComponent } from '../../app.component';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
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

  rateLimited;
  rateLimitReset;
  rateLimitResetTimeRemaining;

  // Fontawesome icons
  faCheck = faCheck;
  faCircle = faCircle;
  faExclamation = faExclamation;
  faExclamationCircle = faExclamationCircle;
  faMinusCircle = faMinusCircle;
  farCircle = farCircle;
  faTimes = faTimes;

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.loadProjectRuns(params['project']);
    });
  }

  getColor(obj) {
    const status = obj.status;

    if (status == 'completed') {
      const conclusion = obj.conclusion;

      if (conclusion == 'success') {
        return '#28A745';
      } else if (conclusion == 'failure' || conclusion == 'startup_failure') {
        return '#CB2431';
      }
    } else if (status == 'in_progress') {
      return '#dbab0a';
    }

    return '#959DA5';
  }

  getIcon(obj) {
    const status = obj.status;

    if (status == 'completed') {
      const conclusion = obj.conclusion;

      if (conclusion == 'success') {
        return faCheck;
      } else if (conclusion == 'failure') {
        return faTimes;
      } else if (conclusion == 'cancelled') {
        return faExclamationCircle;
      } else if (conclusion == 'quequed') {
        return farCircle;
      } else if (conclusion == 'skipped') {
        return faMinusCircle;
      } else if (conclusion == 'startup_failure') {
        return faExclamation;
      }
    } else if (status == 'in_progress') {
      return farCircle;
    } else if (status == 'queued') {
      return faCircle;
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
      hour: 'numeric',
    }).format(date1);
  }

  getDuration(dateStart: string, dateEnd: string): string {
    return AppComponent.getDurationFromMS(
      new Date(dateEnd).getTime() - new Date(dateStart).getTime()
    );
  }

  getDurationFromS(seconds: number): string {
    return AppComponent.getDurationFromS(seconds);
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
    const baseUrl =
      'https://api.github.com/repos/ByMartrixx/' + this.projectName;

    // Request action runs
    this.http
      .get(baseUrl + '/actions/runs', { observe: 'response' })
      .subscribe((response) => {
        const rateLimitRemaining = parseInt(
          response.headers.get('X-Ratelimit-Remaining')
        );
        this.rateLimitReset = response.headers.get('X-Ratelimit-Reset');

        this.rateLimited = rateLimitRemaining <= 0;
        this.rateLimitResetTimeRemaining =
          this.rateLimitReset - Math.floor(new Date().getTime() / 1000);

        if (!this.rateLimited) {
          this.runs = response.body;
          this.workflowRuns = this.runs.workflow_runs;

          this.route.params.subscribe((params) => {
            var run = params['run'];

            if (run == 'latest') {
              this.loadRun(0);
            } else if (run != undefined) {
              this.loadRun(this.runs['total_count'] - run);
            }
          });
        }
      });
  }

  loadRun(run) {
    this.deselectRun();

    let count = this.runs['total_count'];

    if (count == null || count == 0) {
      return;
    }

    this.selectedRun = this.workflowRuns[run];
    if (this.selectedRun == null) {
      return;
    }

    this.http
      .get(this.selectedRun.jobs_url, { observe: 'response' })
      .subscribe((response) => {
        const rateLimitRemaining = parseInt(
          response.headers.get('X-Ratelimit-Remaining')
        );
        this.rateLimitReset = response.headers.get('X-Ratelimit-Reset');

        this.rateLimited = rateLimitRemaining <= 0;
        this.rateLimitResetTimeRemaining =
          this.rateLimitReset - Math.floor(new Date().getTime() / 1000);

        if (!this.rateLimited) {
          try {
            this.jobCount = response.body['total_count'];
            this.jobs = response.body['jobs'];
          } catch {
            this.jobCount = 0;
            this.jobs = null;
          }

          this.loadJob(0);
        }
      });

    try {
      window.scrollTo(0, document.getElementById('build-info').offsetWidth);
    } catch (error) {}
  }

  loadJob(job) {
    this.deselectJob();

    if (this.jobCount == 0) {
      return;
    }

    this.selectedJob = this.jobs[job];
    if (this.selectedJob == null) {
      return;
    }
    this.selectedJobNum = job + 1;
    this.steps = this.selectedJob.steps;
  }
}
