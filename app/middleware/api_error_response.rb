# Error envelope matching contract/main.tsp's ApiError/ValidationError/NotFoundError:
# `{ error: { code, message } }`. Replaces openapi_first's default
# application/problem+json shape so request-validation failures (schema-level
# constraints like @minLength/@minValue) match what the controllers return
# for business-rule validation failures.
class ApiErrorResponse
  include OpenapiFirst::ErrorResponse

  OpenapiFirst.register_error_response(:api_error, self)

  NOT_FOUND = { status: 404, code: "not_found" }.freeze
  VALIDATION = { status: 422, code: "validation" }.freeze
  private_constant :NOT_FOUND, :VALIDATION

  def status
    classification.fetch(:status)
  end

  def code
    classification.fetch(:code)
  end

  def message
    return "Not Found" unless failure.errors

    failure.errors.map(&:message).uniq.join("; ")
  end

  def body
    JSON.generate(error: { code: code, message: message })
  end

  def content_type
    "application/json"
  end

  private

  def classification
    failure.type == :not_found ? NOT_FOUND : VALIDATION
  end
end
