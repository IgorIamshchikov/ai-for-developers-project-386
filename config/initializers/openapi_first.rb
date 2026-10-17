OpenapiFirst.register(Rails.root.join("contract/openapi.yaml").to_s)

# Required explicitly: initializers run before app/ is wired into the
# autoloader, so the bare constants aren't resolvable yet.
require Rails.root.join("app/middleware/api_error_response")
require Rails.root.join("app/middleware/scoped_request_validation")

# Validates /api requests against the contract; everything else (/up, future
# non-API routes) bypasses it.
Rails.application.config.middleware.use ScopedRequestValidation
