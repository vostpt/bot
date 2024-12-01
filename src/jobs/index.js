const schedule = require('node-schedule');

class JobScheduler {
  /**
   * @param {Object} client - The client instance for sending notifications
   * @param {Object} config - Configuration object containing channels and other settings
   */
  constructor(client, config) {
    this.client = client;
    this.config = config;
    this.jobs = new Map(); // Store active jobs
  }

  /**
   * Initialize all production jobs
   */
  startProductionJobs() {
  }

  /**
   * Initialize all beta/testing jobs
   */
  startBetaJobs() {
  }

  /**
   * Schedule a new job
   * @param {String} jobName - Unique identifier for the job
   * @param {Object} schedule - Schedule configuration (can be cron or recurrence rule)
   * @param {Function} task - The function to execute
   */
  scheduleJob(jobName, scheduleConfig, task) {
    try {
      const job = schedule.scheduleJob(scheduleConfig, async () => {
        try {
          await task();
        } catch (error) {
          this.handleJobError(jobName, error);
        }
      });

      this.jobs.set(jobName, job);
    } catch (error) {
      this.handleJobError(jobName, error);
    }
  }

  /**
   * Create a recurrence rule
   * @param {Object} config - Configuration for the schedule
   * @returns {schedule.RecurrenceRule}
   */
  createRecurrenceRule({ minute, hour, dayOfMonth, dayOfWeek } = {}) {
    const rule = new schedule.RecurrenceRule();

    if (minute !== undefined) rule.minute = minute;
    if (hour !== undefined) rule.hour = hour;
    if (dayOfMonth !== undefined) rule.dayOfMonth = dayOfMonth;
    if (dayOfWeek !== undefined) rule.dayOfWeek = dayOfWeek;

    return rule;
  }

  /**
   * Handle job execution errors
   * @param {String} jobName - Name of the failed job
   * @param {Error} error - Error object
   */
  handleJobError(jobName, error) {
    console.error(`Error in job ${jobName}:`, error);
    // Add your error handling logic here
  }

  /**
   * Stop a specific job
   * @param {String} jobName - Name of the job to stop
   */
  stopJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.cancel();
      this.jobs.delete(jobName);
    }
  }

  /**
   * Stop all running jobs
   */
  stopAllJobs() {
    for (const [jobName] of this.jobs) {
      this.stopJob(jobName);
    }
  }
}

module.exports = JobScheduler;
