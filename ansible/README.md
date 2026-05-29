# StudyHive Ansible Demo

This folder is an educational Ansible demo for automating a StudyHive backend deployment. It does not change the app, Firebase config, Firestore logic, Render config, frontend UI, authentication, posts, inbox, or realtime features.

## What Ansible Is

Ansible is an automation tool used to configure servers and deploy applications. Instead of manually SSHing into a VM and typing commands one by one, you describe the desired setup in a YAML playbook. Ansible connects to the server over SSH and runs those steps repeatably.

## Why StudyHive Uses It In This Demo

StudyHive is already deployed, but this demo shows how the backend could be prepared on a plain Linux VM. It is useful for explaining deployment automation, repeatability, and infrastructure documentation in a classroom setting.

## Files

- `inventory.ini.example` lists the target server group and placeholder SSH connection details.
- `deploy-backend.yml` demonstrates backend deployment tasks for a Linux VM.
- `README.md` explains the demo, commands, and talking points.

## What The Playbook Automates

The playbook demonstrates how to:

- update apt package metadata
- install Git and basic system packages
- install Node.js
- clone or pull the StudyHive GitHub repository
- run `npm install` in the `backend` folder
- create `backend/.env` from Ansible variables
- start or restart the backend using PM2

All secrets are placeholders. Do not commit real Firebase service account values, Brevo API keys, or production secrets.

## How To Run

Copy the example inventory:

```bash
cp ansible/inventory.ini.example ansible/inventory.ini
```

Edit `ansible/inventory.ini` and replace `YOUR_SERVER_IP` and `ansible_user` with your VM details.

Run a syntax check:

```bash
ansible-playbook -i ansible/inventory.ini ansible/deploy-backend.yml --syntax-check
```

Run the demo playbook:

```bash
ansible-playbook -i ansible/inventory.ini ansible/deploy-backend.yml \
  -e "studyhive_repo_url=https://github.com/YOUR_USERNAME/study-collab-saas-js.git" \
  -e "frontend_origin=https://YOUR_FRONTEND_DOMAIN.example"
```

For a real VM, pass real values securely through Ansible Vault, CI/CD secrets, or environment-specific variable files. This demo intentionally uses placeholders.

## Professor Demo Explanation

You can explain it like this:

"Ansible lets us describe backend deployment as code. For StudyHive, this playbook prepares a server by installing Git, Node.js, and PM2, then it pulls the StudyHive repository, installs backend dependencies, writes the backend environment file from variables, and starts or restarts the Express backend with PM2. The important idea is repeatability: instead of manually configuring each server, we can run the same playbook and get the same backend setup every time."

Useful points to mention:

- `inventory.ini` answers "which server should Ansible manage?"
- `deploy-backend.yml` answers "what steps should be applied to that server?"
- Variables keep server-specific values separate from the automation steps.
- Secret values are placeholders in this repo and should be provided securely in real deployments.
- PM2 keeps the Node.js backend running after the SSH session ends.

## Safety Notes

- This is a demo setup, not the active Render/Firebase deployment.
- It does not include real Firebase or Brevo credentials.
- It does not modify StudyHive frontend, auth, 2FA, posts, inbox, or realtime code.
- It should be tested with `--syntax-check` before using it against any VM.
