import type { Category } from '../api/types';

export interface CheatItem {
  topic: Category;
  title: string;
  command: string;
  description: string;
}

export const CHEATSHEET: CheatItem[] = [
  {
    "topic": "docker",
    "title": "Containers and status",
    "command": "docker ps -a",
    "description": "List all containers, including stopped ones"
  },
  {
    "topic": "docker",
    "title": "Follow logs",
    "command": "docker logs -f --tail 100 <container>",
    "description": "Stream the last 100 log lines"
  },
  {
    "topic": "docker",
    "title": "Shell inside",
    "command": "docker exec -it <container> sh",
    "description": "Open an interactive shell in a running container"
  },
  {
    "topic": "docker",
    "title": "Rebuild stack",
    "command": "docker compose up -d --build",
    "description": "Rebuild images and restart the compose stack"
  },
  {
    "topic": "docker",
    "title": "Free disk space",
    "command": "docker system prune -af",
    "description": "Remove unused images, containers and networks"
  },
  {
    "topic": "kubernetes",
    "title": "All pods",
    "command": "kubectl get pods -A -o wide",
    "description": "Pods in every namespace with node info"
  },
  {
    "topic": "kubernetes",
    "title": "Why is it failing?",
    "command": "kubectl describe pod <pod>",
    "description": "Events show CrashLoopBackOff, image or probe errors"
  },
  {
    "topic": "kubernetes",
    "title": "Pod logs",
    "command": "kubectl logs -f <pod> --previous",
    "description": "Logs of the previous crashed container"
  },
  {
    "topic": "kubernetes",
    "title": "Restart deployment",
    "command": "kubectl rollout restart deploy/<name>",
    "description": "Rolling restart without downtime"
  },
  {
    "topic": "kubernetes",
    "title": "Switch context",
    "command": "kubectl config use-context <ctx>",
    "description": "Change the active cluster"
  },
  {
    "topic": "linux",
    "title": "Service logs",
    "command": "journalctl -u <service> -f",
    "description": "Follow systemd unit logs"
  },
  {
    "topic": "linux",
    "title": "Listening ports",
    "command": "ss -tulpn",
    "description": "TCP/UDP sockets with owning processes"
  },
  {
    "topic": "linux",
    "title": "Disk usage",
    "command": "df -h && du -sh * | sort -h",
    "description": "Free space and biggest folders"
  },
  {
    "topic": "linux",
    "title": "Service status",
    "command": "systemctl status <service>",
    "description": "State, recent logs and unit file location"
  },
  {
    "topic": "networking",
    "title": "HTTP headers",
    "command": "curl -I https://example.com",
    "description": "Check status code and headers"
  },
  {
    "topic": "networking",
    "title": "DNS lookup",
    "command": "dig +short example.com",
    "description": "Resolve a name quickly"
  },
  {
    "topic": "networking",
    "title": "Firewall rules",
    "command": "iptables -L -n -v --line-numbers",
    "description": "List rules with counters"
  },
  {
    "topic": "cicd",
    "title": "Pretty git history",
    "command": "git log --oneline --graph --decorate",
    "description": "Branch graph in one screen"
  },
  {
    "topic": "cicd",
    "title": "Tidy last commits",
    "command": "git rebase -i HEAD~3",
    "description": "Squash or reword before opening a merge request"
  },
  {
    "topic": "cicd",
    "title": "Save work in progress",
    "command": "git stash push -m \"wip\"",
    "description": "Stash changes with a message"
  },
  {
    "topic": "terraform",
    "title": "Init",
    "command": "terraform init",
    "description": "Download providers and configure the backend"
  },
  {
    "topic": "terraform",
    "title": "Plan to file",
    "command": "terraform plan -out=tfplan",
    "description": "Save the plan so apply uses exactly this"
  },
  {
    "topic": "terraform",
    "title": "Apply plan",
    "command": "terraform apply tfplan",
    "description": "Apply the saved plan"
  },
  {
    "topic": "terraform",
    "title": "Format code",
    "command": "terraform fmt -recursive",
    "description": "Canonical formatting for all files"
  },
  {
    "topic": "aws",
    "title": "Who am I?",
    "command": "aws sts get-caller-identity",
    "description": "Verify the active credentials and account"
  },
  {
    "topic": "aws",
    "title": "List bucket",
    "command": "aws s3 ls s3://<bucket> --recursive --human-readable",
    "description": "Objects with sizes"
  },
  {
    "topic": "monitoring",
    "title": "Validate Prometheus config",
    "command": "promtool check config prometheus.yml",
    "description": "Catch YAML and rule errors before reload"
  },
  {
    "topic": "devsecops",
    "title": "Scan an image",
    "command": "trivy image <image>:<tag>",
    "description": "Find known CVEs in a container image"
  },
  {
    "topic": "devsecops",
    "title": "Fail2Ban status",
    "command": "fail2ban-client status sshd",
    "description": "Currently banned IPs for SSH"
  }
];
