---
name: monitoring
description: Observability and monitoring setup skill — structured logging, metrics, distributed tracing, and alerting.
---

# Monitoring & Observability Skill

## Objective
Instrument services so production issues are detected before users report them. Implement the three pillars: logs, metrics, traces.

## Steps
1. **Instrument** — add structured logging, metrics, and trace spans to all services.
2. **Centralise** — ship logs to central store; metrics to time-series DB; traces to APM.
3. **Dashboards** — build RED (Rate/Errors/Duration) dashboard per service; USE (Utilisation/Saturation/Errors) for infra.
4. **Alerts** — configure symptom-based SLO burn rate alerts; avoid noisy metric-threshold alerts.
5. **Runbooks** — write runbook for every alert: what it means, how to investigate, how to resolve.
6. **SLOs** — define and publish SLO targets; track error budget consumption.
7. **Validate** — trigger test alert; confirm paging works end-to-end.

## Structured log format (mandatory fields)
```json
{
  "timestamp": "ISO 8601",
  "level": "INFO|WARN|ERROR",
  "service": "order-service",
  "version": "1.2.3",
  "traceId": "...",
  "spanId": "...",
  "requestId": "...",
  "userId": "hashed-or-omitted",
  "message": "...",
  "durationMs": 42
}
```
**Never log**: passwords, tokens, card numbers, PAN, CVV, full account numbers, passport numbers, SSN.

## Metrics (RED model per service)
- Rate: requests per second
- Errors: error rate (4xx/5xx as %)
- Duration: p50, p95, p99 latency

## Alert tiers
- **P1 alert (page immediately)**: SLO error budget burn rate > 14× (1h window) — service is failing fast
- **P2 alert (page in 30 min)**: error budget burn rate > 6× (6h window)
- **P3 (ticket)**: single anomaly; not sustained

## Tooling by platform
- **AWS**: CloudWatch Logs + Metrics, X-Ray (traces), CloudWatch Alarms → SNS → PagerDuty
- **Azure**: Azure Monitor + App Insights (traces + logs), Azure Alerts → Teams/PagerDuty
- **GCP**: Cloud Logging + Cloud Monitoring, Cloud Trace, Alerting Policies
- **Multi-cloud/on-prem**: Prometheus + Grafana + Loki + Tempo (full OSS stack); Datadog (SaaS)

## Vertical-specific requirements
- **Regulated Financial Services**: all financial transaction events logged with correlation ID; regulatory audit log separate from operational log (immutable, 7-year retention)
- **Digital Commerce**: business metrics dashboard (conversion rate, cart abandonment, checkout completion) alongside technical metrics
- **Travel and Service Operations and Service Operations**: GDS call success rate and latency tracked separately; downstream availability directly impacts business

Never fabricate monitoring results or alert statuses.
