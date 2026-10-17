# OpenapiFirst::Middlewares::RequestValidation rejects any path that isn't
# described in the OpenAPI contract (contract/openapi.yaml covers only /api).
# This wraps it so routes outside /api (/up, future non-API routes) bypass
# the contract instead of getting a 404 from it.
class ScopedRequestValidation
  def initialize(app, path_prefix: "/api")
    @app = app
    @path_prefix = path_prefix
    @validator = OpenapiFirst::Middlewares::RequestValidation.new(app)
  end

  def call(env)
    return @app.call(env) unless env["PATH_INFO"].start_with?(@path_prefix)

    @validator.call(env)
  end
end
