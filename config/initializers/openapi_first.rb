OpenapiFirst.register(Rails.root.join("contract/openapi.yaml").to_s)

# Validates /api requests against the contract; everything else (/up, future
# non-API routes) bypasses it. Required explicitly: initializers run before
# app/ is wired into the autoloader, so the bare constant isn't resolvable yet.
require Rails.root.join("app/middleware/scoped_request_validation")
Rails.application.config.middleware.use ScopedRequestValidation
