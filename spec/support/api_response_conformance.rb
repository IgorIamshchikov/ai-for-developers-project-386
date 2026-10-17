# frozen_string_literal: true

# Validates only the response against contract/openapi.yaml. Complements
# `assert_api_conform` (OpenapiFirst::Test::Methods) for specs where the
# *request* is intentionally invalid (e.g. a 422 test) — `assert_api_conform`
# re-validates the request too and raises on exactly that invalid input.
module ApiResponseConformance
  def assert_response_conforms
    validated = OpenapiFirst[:default].validate_response(request, response, raise_error: false)
    raise validated.error.exception if validated.invalid?
  end
end
