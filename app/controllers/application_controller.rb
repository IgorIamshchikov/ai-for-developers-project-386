class ApplicationController < ActionController::API
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found

  private

  def render_not_found
    render json: { error: { code: "not_found", message: "Not Found" } }, status: :not_found
  end
end
