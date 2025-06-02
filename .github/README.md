# GitHub Auto Backup

This repository is set up with an automatic backup mechanism using GitHub Actions.

## How it works

1. A GitHub Actions workflow runs every 15 minutes
2. The workflow automatically commits any changes and pushes them to the repository
3. This ensures that all your work is regularly backed up

## Manual Trigger

You can also manually trigger the backup by:

1. Going to the Actions tab in your GitHub repository
2. Selecting the "Auto Backup" workflow
3. Clicking on "Run workflow"

## Configuration

The backup schedule can be modified by editing the cron expression in `.github/workflows/auto-backup.yml`. 