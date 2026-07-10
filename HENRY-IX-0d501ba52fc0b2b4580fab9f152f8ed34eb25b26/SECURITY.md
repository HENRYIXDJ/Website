# Security Policy

## Supported Versions

As this project is a continuously deployed web application for the Henry IX platform,
security updates are only applied to the active production branch.
Older forks or historical commits are not actively patched.

| Version      | Supported          |
| ------------ | ------------------ |
| main (Latest)| :white_check_mark: |
| Older commits| :x:                |


## Reporting a Vulnerability

Security is a priority. If you discover a vulnerability within this codebase 
(e.g., issues related to the audio engine, state manipulation, or Next.js routing). 
Please report it responsibly so it can be addressed before it is publicly disclosed.
Please do not open a public GitHub issue for security vulnerabilities.

How to Report
Send an email detailing the vulnerability to sitereporting@henryix.com

Please include the following information in your report:

A clear description of the vulnerability and its potential impact.
Step-by-step instructions to reproduce the issue.
Information about the environment (e.g., specific browsers, operating systems, or device types) where the vulnerability occurs.
Any potential mitigations or fixes you might suggest.

What to Expect:

Acknowledgement: You will receive a reply acknowledging receipt of your report within 48 to 72 hours.
Assessment: The vulnerability will be evaluated against the current production deployment.
Resolution: If the vulnerability is accepted, a timeline for a patch will be provided. You will receive an update once
the fix has been merged into main and deployed to the live domain.
Disclosure: Once the issue is resolved, a public disclosure or acknowledgement can be coordinated if desired.

Out of Scope
Please note that vulnerabilities found in third-party services utilised by this application (such as the SoundCloud Widget API or Vercel hosting infrastructure)
should be reported directly to those respective service providers.
