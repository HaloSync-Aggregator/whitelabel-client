# Contributing

Thanks for helping improve `whitelabel-client`.

This repository is a public frontend seed for OTA developers who have completed PolarHub onboarding and received API credentials, as well as for the PolarHub team maintaining the reference implementation and documentation.

## Scope

- Code in this repository is released under the MIT License.
- Access to the PolarHub API is governed separately through PolarHub onboarding and API key issuance.
- If you have completed onboarding and received API credentials, you may use this project to generate and operate your web application with your provisioned middleware and API access.

## How To Report Issues

Issues are welcome for:

- Reproducible bugs in the sample app or templates
- Documentation gaps or incorrect setup instructions
- Confusing behavior in generated tenant output

When opening an issue, please include:

- What you were trying to do
- Exact steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots, logs, or request/response snippets when safe to share
- Tenant/app context if relevant, but never post secrets or API keys

## Pull Requests

Pull request policy is still being finalized.

Until that policy is published:

- Please open an issue first for non-trivial code changes
- Small documentation fixes are welcome
- Maintainers may request changes, re-scope a PR, or close it if it does not fit the current roadmap

## Local Validation

Before submitting a documentation or code change related to the sample app, run:

```bash
cd apps/DEMO001
npm run lint
npx tsc --noEmit
npm run build
```

## Security

For security-sensitive issues, do not open a public GitHub issue. Please contact the maintainers directly.
