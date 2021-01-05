import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { faCircle as farCircle } from '@fortawesome/free-regular-svg-icons';
import {
  faBox,
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
  artifactCount; // <repos{/user}{/repo}/actions/runs{/run_id}/artifacts>.total_count
  artifacts; // <repos{/user}{/repo}/actions/runs{/run_id}/artifacts>.artifacts
  artifactsFetched;

  rateLimited;
  rateLimitReset;
  rateLimitResetTimeRemaining;

  // Fontawesome icons
  faBox = faBox;
  faCheck = faCheck;
  faCircle = faCircle;
  faExclamation = faExclamation;
  faExclamationCircle = faExclamationCircle;
  faMinusCircle = faMinusCircle;
  farCircle = farCircle;
  faTimes = faTimes;

  constructor(private route: ActivatedRoute) {}

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

  getFileSize(bytes: number): string {
    if (bytes < 1000) {
      return bytes + ' B';
    }

    const units = ['kB', 'MB', 'GB', 'TB'];
    let u = -1;

    do {
      bytes /= 1024;
      ++u;
    } while (Math.round(bytes * 10) / 10 >= 1024 && u < units.length - 1);

    return bytes.toFixed(1) + ' ' + units[u];
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

  async loadProjectRuns(repositoryName) {
    this.deselectRun();

    this.projectName = repositoryName;

    // Request action runs
    const response = await AppComponent.octokit.actions.listWorkflowRunsForRepo(
      {
        owner: 'ByMartrixx',
        repo: this.projectName,
      }
    );

    const rateLimitRemaining = parseInt(
      response.headers['x-ratelimit-remaining']
    );
    this.rateLimitReset = response.headers['x-ratelimit-reset'];

    this.rateLimited = rateLimitRemaining <= 0;
    this.rateLimitResetTimeRemaining =
      this.rateLimitReset - Math.floor(new Date().getTime() / 1000);

    if (!this.rateLimited) {
      this.runs = response.data;
      this.workflowRuns = this.runs.workflow_runs;

      this.route.params.subscribe((params) => {
        var run = params['run'];

        if (run == 'latest') {
          this.loadRun(0);
        } else if (run != undefined) {
          this.loadRun(this.runs.total_count - run);
        }
      });
    }
  }

  async loadRun(run) {
    this.deselectRun();

    let count = this.runs['total_count'];

    if (count == null || count == 0) {
      return;
    }

    this.selectedRun = this.workflowRuns[run];
    if (this.selectedRun == null) {
      return;
    }

    const response = await AppComponent.octokit.actions.listJobsForWorkflowRun({
      owner: 'ByMartrixx',
      repo: this.projectName,
      run_id: this.selectedRun.id,
    });

    const rateLimitRemaining = parseInt(
      response.headers['x-ratelimit-remaining']
    );
    this.rateLimitReset = response.headers['x-ratelimit-reset'];

    this.rateLimited = rateLimitRemaining <= 0;
    this.rateLimitResetTimeRemaining =
      this.rateLimitReset - Math.floor(new Date().getTime() / 1000);

    if (!this.rateLimited) {
      try {
        this.jobCount = response.data.total_count;
        this.jobs = response.data.jobs;
      } catch {
        this.jobCount = 0;
        this.jobs = null;
      }

      this.loadJob(0);
    }

    try {
      window.scrollTo(0, document.getElementById('build-info').offsetWidth);
    } catch (error) {}
  }

  loadJob(job: number) {
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

  async loadArtifacts() {
    this.artifactsFetched = true;

    const response = await AppComponent.octokit.actions.listWorkflowRunArtifacts(
      {
        owner: 'ByMartrixx',
        repo: this.projectName,
        run_id: this.selectedRun.id,
      }
    );

    const rateLimitRemaining = parseInt(
      response.headers['x-ratelimit-remaining']
    );
    this.rateLimitReset = response.headers['x-ratelimit-reset'];

    this.rateLimited = rateLimitRemaining <= 0;
    this.rateLimitResetTimeRemaining =
      this.rateLimitReset - Math.floor(new Date().getTime() / 1000);

    if (!this.rateLimited) {
      try {
        this.artifactCount = response.data.total_count;
        this.artifacts = response.data.artifacts;
      } catch {
        this.artifactCount = 0;
        this.artifacts = null;
      }
    }
  }
}
