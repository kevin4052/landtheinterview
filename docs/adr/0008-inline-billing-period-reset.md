# Billing period reset is inline, not webhook-driven

The Mid plan's monthly Tailor Allowance resets by checking `NOW() > current_period_end` inline on each Tailor request, not by waiting for a Stripe webhook to trigger the reset.

Stripe webhooks can be delayed by minutes or hours. A webhook-only reset means a renewed subscriber is incorrectly blocked until the webhook arrives. The inline check costs one timestamp comparison per Tailor request and makes the Allowance state self-healing without coordination. The `customer.subscription.updated` webhook still updates `current_period_end` when it arrives, but the app does not depend on it for correctness.
