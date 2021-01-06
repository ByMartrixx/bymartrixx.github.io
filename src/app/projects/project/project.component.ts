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
  projectName: string;
  runs; // /repos{/user}{/repo}/action/runs
  workflowRuns; // this.runs.workflow_runs
  selectedRun; // this.workflowRuns[n]
  jobCount: number; // </repos{/user}{/repo}/action/runs{/run_id}/jobs>.total_count
  jobs; // </repos{/user}{/repo}/action/runs{/run_id}/jobs>.jobs
  selectedJob; // this.jobs[o]
  selectedJobNum: number; // (^) o
  steps; // this.selectedJob.steps
  artifactCount: number; // <repos{/user}{/repo}/actions/runs{/run_id}/artifacts>.total_count
  artifacts; // <repos{/user}{/repo}/actions/runs{/run_id}/artifacts>.artifacts
  artifactsFetched: boolean;

  runsPage: number = 1;
  lastRunsPage: number = -1;

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
    try {
      return new Intl.DateTimeFormat('default', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        minute: 'numeric',
        hour: 'numeric',
      }).format(date1);
    } catch {
      return date;
    }
  }

  getDuration(dateStart: string, dateEnd: string): string {
    return AppComponent.getHumanReadableDurationMS(
      new Date(dateEnd).getTime() - new Date(dateStart).getTime()
    );
  }

  getDurationFromS(seconds: number): string {
    return AppComponent.getHumanReadableDurationS(seconds);
  }

  getHumanReadableFileSize(bytes: number): string {
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

  async loadProjectRuns(repositoryName: string) {
    this.deselectRun();

    this.projectName = repositoryName;

    await this.loadRuns();
    if (!this.rateLimited) {
      this.route.params.subscribe((params) => {
        var run = params['run'];

        if (run == 'latest') {
          this.loadRun(0);
        } else if (run != undefined) {
          this.loadRun(run);
        }
      });
    }
  }

  async loadRuns() {
    // Request action runs
    const response = await AppComponent.octokit.actions.listWorkflowRunsForRepo(
      {
        owner: 'ByMartrixx',
        repo: this.projectName,
        per_page: 50,
        page: this.runsPage,
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

      if (this.workflowRuns == null) {
        this.workflowRuns = response.data.workflow_runs;
      } else if (this.workflowRuns.length < this.runs.total_count && this.runsPage != this.lastRunsPage) {
        this.workflowRuns = this.workflowRuns.concat(
          response.data.workflow_runs
        );
      }
      this.lastRunsPage = this.runsPage;
    }
  }

  async loadRun(run: number) {
    this.deselectRun();

    let count = this.runs['total_count'];

    if (count == null || count == 0) {
      return;
    }

    if (run <= this.runs.total_count) {
      run = this.runs.total_count - run;
      this.selectedRun = this.workflowRuns[run];
    } else {
      await this.loadRunId(run);
    }

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

  async loadRunId(run_id: number) {
    const response = await AppComponent.octokit.actions.getWorkflowRun({
      owner: 'ByMartrixx',
      repo: this.projectName,
      run_id: run_id,
    });

    const rateLimitRemaining = parseInt(
      response.headers['x-ratelimit-remaining']
    );
    this.rateLimitReset = response.headers['x-ratelimit-reset'];

    this.rateLimited = rateLimitRemaining <= 0;
    this.rateLimitResetTimeRemaining =
      this.rateLimitReset - Math.floor(new Date().getTime() / 1000);

    if (!this.rateLimited) {
      if (response.status == 200) {
        this.selectedRun = response.data;
      }
    }
  }

  async loadMoreRuns() {
    if (this.runsPage < Math.ceil(this.runs.total_count / 50)) {
      this.runsPage++;
      await this.loadRuns();
    }
  }
}
